import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ApprovalsService } from '../approvals/approvals.service';
import {
  ChangeRequestQueryDto,
  CreateChangeRequestDto,
  UpdateChangeRequestDto,
} from './dto/change-request.dto';
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
export class ChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
    private readonly approvalsService: ApprovalsService,
  ) {}

  private isElevatedUser(user: AuthenticatedUser): boolean {
    return (
      user.roles.includes('SUPER_ADMIN') ||
      user.roles.includes('ADMIN') ||
      user.permissions.includes('*')
    );
  }

  private async verifyProjectAccess(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    if (!this.isElevatedUser(user)) {
      const isMember = project.members.some((m) => m.userId === user.id);
      const isOwner = project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('You do not have access to this project.');
      }
    }

    return project;
  }

  async create(projectId: string, dto: CreateChangeRequestDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create change requests on an archived project.');
    }

    const lastRequest = await this.prisma.changeRequest.findFirst({
      where: { projectId },
      orderBy: { requestNumber: 'desc' },
      select: { requestNumber: true },
    });
    const requestNumber = (lastRequest?.requestNumber || 0) + 1;

    const changeRequest = await this.prisma.changeRequest.create({
      data: {
        projectId,
        requestNumber,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: ChangeRequestStatus.DRAFT,
        reason: dto.reason,
        impactSummary: dto.impactSummary,
        scheduleImpactDays: dto.scheduleImpactDays || 0,
        costImpact: dto.costImpact,
        resourceImpact: dto.resourceImpact,
        scopeImpact: dto.scopeImpact,
        riskImpact: dto.riskImpact,
        requestedById: user.id,
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CHANGE_REQUEST,
      entityId: changeRequest.id,
      metadata: {
        projectId,
        requestNumber,
        title: changeRequest.title,
        type: changeRequest.type,
      },
    });

    return changeRequest;
  }

  async findAll(projectId: string, query: ChangeRequestQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const {
      page = 1,
      limit = 20,
      status,
      type,
      requestedById,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.ChangeRequestWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (requestedById) where.requestedById = requestedById;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.changeRequest.count({ where }),
      this.prisma.changeRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          requestedBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          rejectedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const changeRequest = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true, status: true, ownerId: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        rejectedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvalRequests: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: {
                approverUser: { select: { id: true, firstName: true, lastName: true } },
                actionBy: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
        attachments: {
          where: { deletedAt: null },
          select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
        },
      },
    });

    if (!changeRequest || changeRequest.deletedAt) {
      throw new NotFoundException(`Change request with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(changeRequest.projectId, user);
    return changeRequest;
  }

  async update(id: string, dto: UpdateChangeRequestDto, user: AuthenticatedUser) {
    const existing = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Change request with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.status !== ChangeRequestStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT change requests can be edited.');
    }

    // Requester or admin can update draft
    if (existing.requestedById !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('Only the author or an administrator can edit this draft.');
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        reason: dto.reason,
        impactSummary: dto.impactSummary,
        scheduleImpactDays: dto.scheduleImpactDays,
        costImpact: dto.costImpact,
        resourceImpact: dto.resourceImpact,
        scopeImpact: dto.scopeImpact,
        riskImpact: dto.riskImpact,
      },
      include: {
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CHANGE_REQUEST,
      entityId: id,
      metadata: { projectId: updated.projectId, title: updated.title },
    });

    return updated;
  }

  /**
   * Submit change request for review and trigger approval workflow
   */
  async submit(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Change request with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.status !== ChangeRequestStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit change request currently in ${existing.status} status.`);
    }

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot submit change requests on an archived project.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.changeRequest.update({
        where: { id },
        data: {
          status: ChangeRequestStatus.SUBMITTED,
          requestedAt: new Date(),
        },
      });

      // Create approval pipeline: Step 1 = Project Owner or Admin
      await this.approvalsService.createApprovalRequest(
        {
          entityType: ApprovalEntityType.CHANGE_REQUEST,
          entityId: id,
          projectId: existing.projectId,
          changeRequestId: id,
          requestedById: existing.requestedById,
          steps: [
            {
              stepOrder: 1,
              approverUserId: existing.project.ownerId, // Assigned to Project Owner
            },
          ],
        },
        tx,
      );

      await this.activityLogs.log({
        actorId: user.id,
        action: AuditAction.SUBMIT,
        entityType: AuditEntityType.CHANGE_REQUEST,
        entityId: id,
        metadata: {
          projectId: existing.projectId,
          requestNumber: existing.requestNumber,
          title: existing.title,
        },
      });

      return updated;
    });
  }

  /**
   * Mark an approved change request as implemented
   */
  async implement(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Change request with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.status !== ChangeRequestStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED change requests can be marked as IMPLEMENTED.');
    }

    const updated = await this.prisma.changeRequest.update({
      where: { id },
      data: { status: ChangeRequestStatus.IMPLEMENTED },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.CHANGE_REQUEST,
      entityId: id,
      metadata: {
        projectId: existing.projectId,
        requestNumber: existing.requestNumber,
        status: 'IMPLEMENTED',
      },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.changeRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Change request with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.status === ChangeRequestStatus.APPROVED || existing.status === ChangeRequestStatus.IMPLEMENTED) {
      throw new BadRequestException('Cannot delete approved or implemented change requests.');
    }

    await this.prisma.changeRequest.update({
      where: { id },
      data: { deletedAt: new Date(), status: ChangeRequestStatus.CANCELLED },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.CHANGE_REQUEST,
      entityId: id,
      metadata: { projectId: existing.projectId, title: existing.title },
    });

    return { message: 'Change request removed successfully.' };
  }
}
