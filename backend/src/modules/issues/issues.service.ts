import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateIssueDto,
  IssueQueryDto,
  ResolveIssueDto,
  UpdateIssueDto,
} from './dto/issue.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, IssueStatus, Prisma } from '@prisma/client';

@Injectable()
export class IssuesService {
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

  private async validateCrossProjectRelationships(
    projectId: string,
    milestoneId?: string,
    taskId?: string,
    riskId?: string,
  ) {
    if (milestoneId) {
      const milestone = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
      if (!milestone || milestone.deletedAt || milestone.projectId !== projectId) {
        throw new BadRequestException('Linked milestone does not exist in this project.');
      }
    }

    if (taskId) {
      const task = await this.prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.deletedAt || task.projectId !== projectId) {
        throw new BadRequestException('Linked task does not exist in this project.');
      }
    }

    if (riskId) {
      const risk = await this.prisma.risk.findUnique({ where: { id: riskId } });
      if (!risk || risk.deletedAt || risk.projectId !== projectId) {
        throw new BadRequestException('Linked risk does not exist in this project.');
      }
    }
  }

  async create(projectId: string, dto: CreateIssueDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot report issues on an archived project.');
    }

    await this.validateCrossProjectRelationships(projectId, dto.milestoneId, dto.taskId, dto.riskId);

    if (dto.ownerId) {
      const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
      if (!owner || owner.deletedAt) {
        throw new NotFoundException(`Owner with ID "${dto.ownerId}" not found.`);
      }
    }

    const lastIssue = await this.prisma.issue.findFirst({
      where: { projectId },
      orderBy: { issueNumber: 'desc' },
      select: { issueNumber: true },
    });
    const issueNumber = (lastIssue?.issueNumber || 0) + 1;

    const issue = await this.prisma.issue.create({
      data: {
        projectId,
        issueNumber,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        severity: dto.severity,
        priority: dto.priority,
        status: IssueStatus.OPEN,
        reportedById: user.id,
        ownerId: dto.ownerId || null,
        milestoneId: dto.milestoneId || null,
        taskId: dto.taskId || null,
        riskId: dto.riskId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        milestone: { select: { id: true, name: true } },
        task: { select: { id: true, taskNumber: true, title: true } },
        risk: { select: { id: true, riskNumber: true, title: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.ISSUE,
      entityId: issue.id,
      metadata: {
        projectId,
        issueNumber,
        title: issue.title,
        severity: issue.severity,
      },
    });

    return issue;
  }

  async findAll(projectId: string, query: IssueQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const {
      page = 1,
      limit = 20,
      status,
      type,
      severity,
      priority,
      ownerId,
      milestoneId,
      taskId,
      riskId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.IssueWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (priority) where.priority = priority;
    if (ownerId) where.ownerId = ownerId;
    if (milestoneId) where.milestoneId = milestoneId;
    if (taskId) where.taskId = taskId;
    if (riskId) where.riskId = riskId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { resolution: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, issues] = await Promise.all([
      this.prisma.issue.count({ where }),
      this.prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          reportedBy: { select: { id: true, firstName: true, lastName: true } },
          owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          milestone: { select: { id: true, name: true } },
          task: { select: { id: true, taskNumber: true, title: true } },
          risk: { select: { id: true, riskNumber: true, title: true } },
          _count: { select: { attachments: true } },
        },
      }),
    ]);

    return createPaginatedResult(issues, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true, status: true, ownerId: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        milestone: { select: { id: true, name: true, status: true } },
        task: { select: { id: true, taskNumber: true, title: true, status: true } },
        risk: { select: { id: true, riskNumber: true, title: true, riskScore: true } },
        attachments: {
          where: { deletedAt: null },
          select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
        },
      },
    });

    if (!issue || issue.deletedAt) {
      throw new NotFoundException(`Issue with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(issue.projectId, user);
    return issue;
  }

  async update(id: string, dto: UpdateIssueDto, user: AuthenticatedUser) {
    const existing = await this.prisma.issue.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Issue with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot update issues on an archived project.');
    }

    await this.validateCrossProjectRelationships(
      existing.projectId,
      dto.milestoneId !== undefined ? dto.milestoneId : undefined,
      dto.taskId !== undefined ? dto.taskId : undefined,
      dto.riskId !== undefined ? dto.riskId : undefined,
    );

    const data: Prisma.IssueUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === IssueStatus.RESOLVED || dto.status === IssueStatus.CLOSED) {
        data.resolvedDate = new Date();
      } else if (dto.status === IssueStatus.OPEN || dto.status === IssueStatus.IN_PROGRESS) {
        data.resolvedDate = null;
      }
    }

    if (dto.ownerId !== undefined) {
      if (dto.ownerId) {
        const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
        if (!owner || owner.deletedAt) throw new NotFoundException(`User with ID "${dto.ownerId}" not found.`);
        data.owner = { connect: { id: dto.ownerId } };
      } else {
        data.owner = { disconnect: true };
      }
    }

    if (dto.milestoneId !== undefined) {
      data.milestone = dto.milestoneId ? { connect: { id: dto.milestoneId } } : { disconnect: true };
    }
    if (dto.taskId !== undefined) {
      data.task = dto.taskId ? { connect: { id: dto.taskId } } : { disconnect: true };
    }
    if (dto.riskId !== undefined) {
      data.risk = dto.riskId ? { connect: { id: dto.riskId } } : { disconnect: true };
    }

    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.resolution !== undefined) {
      data.resolution = dto.resolution;
    }

    const updated = await this.prisma.issue.update({
      where: { id },
      data,
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        milestone: { select: { id: true, name: true } },
        task: { select: { id: true, taskNumber: true, title: true } },
        risk: { select: { id: true, riskNumber: true, title: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: dto.status && dto.status !== existing.status ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE,
      entityType: AuditEntityType.ISSUE,
      entityId: updated.id,
      metadata: {
        projectId: updated.projectId,
        issueNumber: updated.issueNumber,
        oldStatus: existing.status,
        newStatus: updated.status,
      },
    });

    return updated;
  }

  async resolve(id: string, dto: ResolveIssueDto, user: AuthenticatedUser) {
    const existing = await this.prisma.issue.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Issue with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot resolve issues on an archived project.');
    }

    const resolved = await this.prisma.issue.update({
      where: { id },
      data: {
        status: IssueStatus.RESOLVED,
        resolvedDate: new Date(),
        resolution: dto.resolution,
      },
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.ISSUE,
      entityId: resolved.id,
      metadata: {
        projectId: resolved.projectId,
        issueNumber: resolved.issueNumber,
        status: 'RESOLVED',
        resolution: dto.resolution,
      },
    });

    return resolved;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.issue.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Issue with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot delete issues from an archived project.');
    }

    await this.prisma.issue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.ISSUE,
      entityId: id,
      metadata: { projectId: existing.projectId, title: existing.title },
    });

    return { message: 'Issue removed successfully.' };
  }
}
