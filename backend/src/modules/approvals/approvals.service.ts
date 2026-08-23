import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ActionApprovalStepDto, ApprovalQueryDto } from './dto/approval.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import {
  ApprovalEntityType,
  ApprovalStatus,
  AuditAction,
  AuditEntityType,
  ChangeRequestStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private isElevatedUser(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes('SUPER_ADMIN') ||
      user.roles.includes('ADMIN') ||
      user.permissions.includes('*')
    );
  }

  /**
   * Initialize an approval request with steps
   */
  async createApprovalRequest(
    data: {
      entityType: ApprovalEntityType;
      entityId: string;
      projectId?: string;
      changeRequestId?: string;
      requestedById: string;
      steps: {
        stepOrder: number;
        approverRoleId?: string;
        approverUserId?: string;
      }[];
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    const request = await client.approvalRequest.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        projectId: data.projectId,
        changeRequestId: data.changeRequestId,
        requestedById: data.requestedById,
        status: ApprovalStatus.PENDING,
        currentStep: 1,
        totalSteps: data.steps.length,
        steps: {
          create: data.steps.map((s) => ({
            stepOrder: s.stepOrder,
            approverRoleId: s.approverRoleId,
            approverUserId: s.approverUserId,
            status: ApprovalStatus.PENDING,
          })),
        },
      },
      include: { steps: true },
    });

    return request;
  }

  async findAll(query: ApprovalQueryDto, user: AuthenticatedUser) {
    const { page = 1, limit = 20, status, entityType, projectId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApprovalRequestWhereInput = {};
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (projectId) where.projectId = projectId;

    // Scoping for non-admins
    if (!this.isElevatedUser(user)) {
      where.OR = [
        { requestedById: user.id },
        { steps: { some: { approverUserId: user.id } } },
        { project: { members: { some: { userId: user.id } } } },
        { project: { ownerId: user.id } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.approvalRequest.count({ where }),
      this.prisma.approvalRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          project: { select: { id: true, name: true, code: true } },
          changeRequest: { select: { id: true, requestNumber: true, title: true, type: true } },
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: {
              approverUser: { select: { id: true, firstName: true, lastName: true, email: true } },
              actionBy: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
      }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, code: true, ownerId: true } },
        changeRequest: {
          include: {
            requestedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            approverUser: { select: { id: true, firstName: true, lastName: true, email: true } },
            actionBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Approval request with ID "${id}" not found.`);
    }

    return request;
  }

  /**
   * Action an approval step (Approve or Reject)
   */
  async actionStep(requestId: string, stepId: string, dto: ActionApprovalStepDto, user: AuthenticatedUser) {
    if (dto.status !== ApprovalStatus.APPROVED && dto.status !== ApprovalStatus.REJECTED) {
      throw new BadRequestException('Status must be APPROVED or REJECTED.');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
          project: true,
          changeRequest: true,
        },
      });

      if (!request) {
        throw new NotFoundException(`Approval request with ID "${requestId}" not found.`);
      }

      if (request.status !== ApprovalStatus.PENDING) {
        throw new BadRequestException(`Cannot action request in ${request.status} state.`);
      }

      const currentStepObj = request.steps.find((s) => s.id === stepId);
      if (!currentStepObj) {
        throw new NotFoundException(`Approval step with ID "${stepId}" not found in this request.`);
      }

      if (currentStepObj.stepOrder !== request.currentStep) {
        throw new BadRequestException(`Step ${currentStepObj.stepOrder} is not the active step (Active step is ${request.currentStep}).`);
      }

      if (currentStepObj.status !== ApprovalStatus.PENDING) {
        throw new BadRequestException('This step has already been actioned.');
      }

      // Self-approval restriction: requester cannot approve unless Super Admin / Admin
      const isElevated = this.isElevatedUser(user);
      if (request.requestedById === user.id && !isElevated) {
        throw new ForbiddenException('Requesters cannot approve their own approval requests.');
      }

      // Check if user is authorized to action this step
      const isAssignedUser = currentStepObj.approverUserId === user.id;
      const isProjectOwner = request.project?.ownerId === user.id;
      if (!isAssignedUser && !isProjectOwner && !isElevated) {
        throw new ForbiddenException('You are not an authorized approver for this step.');
      }

      const now = new Date();

      // Update the step
      await tx.approvalStep.update({
        where: { id: stepId },
        data: {
          status: dto.status,
          actionById: user.id,
          actionAt: now,
          comments: dto.comments || null,
        },
      });

      let updatedRequestStatus: ApprovalStatus = request.status;

      if (dto.status === ApprovalStatus.REJECTED) {
        // Entire request is rejected
        updatedRequestStatus = ApprovalStatus.REJECTED;
        await tx.approvalRequest.update({
          where: { id: requestId },
          data: { status: ApprovalStatus.REJECTED },
        });

        // Cascade to ChangeRequest if applicable
        if (request.entityType === ApprovalEntityType.CHANGE_REQUEST && request.changeRequestId) {
          await tx.changeRequest.update({
            where: { id: request.changeRequestId },
            data: {
              status: ChangeRequestStatus.REJECTED,
              rejectedById: user.id,
              rejectedAt: now,
              rejectionReason: dto.comments || 'Rejected in approval workflow',
            },
          });
        }
      } else if (dto.status === ApprovalStatus.APPROVED) {
        if (request.currentStep < request.totalSteps) {
          // Advance to next step
          await tx.approvalRequest.update({
            where: { id: requestId },
            data: { currentStep: request.currentStep + 1 },
          });
        } else {
          // All steps completed!
          updatedRequestStatus = ApprovalStatus.APPROVED;
          await tx.approvalRequest.update({
            where: { id: requestId },
            data: { status: ApprovalStatus.APPROVED },
          });

          // Cascade to ChangeRequest if applicable
          if (request.entityType === ApprovalEntityType.CHANGE_REQUEST && request.changeRequestId) {
            await tx.changeRequest.update({
              where: { id: request.changeRequestId },
              data: {
                status: ChangeRequestStatus.APPROVED,
                approvedById: user.id,
                approvedAt: now,
              },
            });
          }
        }
      }

      await this.activityLogs.log({
        actorId: user.id,
        action: dto.status === ApprovalStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
        entityType: AuditEntityType.APPROVAL,
        entityId: requestId,
        metadata: {
          stepOrder: currentStepObj.stepOrder,
          status: dto.status,
          comments: dto.comments,
          finalRequestStatus: updatedRequestStatus,
        },
      });

      return tx.approvalRequest.findUnique({
        where: { id: requestId },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
            include: {
              approverUser: { select: { id: true, firstName: true, lastName: true } },
              actionBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      });
    });
  }
}
