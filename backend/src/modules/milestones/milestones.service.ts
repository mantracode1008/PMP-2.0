import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneQueryDto } from './dto/milestone-query.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, Prisma, MilestoneStatus } from '@prisma/client';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MilestonesService {
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

  async findAllByProject(projectId: string, query: MilestoneQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const { page = 1, limit = 20, search, status, sortBy = 'dueDate', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const conditions: Prisma.MilestoneWhereInput[] = [
      { projectId, deletedAt: null },
    ];

    if (status) conditions.push({ status });
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.MilestoneWhereInput = { AND: conditions };

    const [total, milestones] = await Promise.all([
      this.prisma.milestone.count({ where }),
      this.prisma.milestone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: {
            select: {
              tasks: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const formatted = milestones.map((m) => ({
      ...m,
      taskCount: m._count.tasks,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            progress: true,
            dueDate: true,
          },
        },
      },
    });

    if (!milestone || milestone.deletedAt) {
      throw new NotFoundException(`Milestone with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(milestone.projectId, user);
    return milestone;
  }

  async create(projectId: string, dto: CreateMilestoneDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    if (dto.startDate && dto.dueDate && new Date(dto.startDate) > new Date(dto.dueDate)) {
      throw new BadRequestException('Milestone start date cannot be later than due date.');
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        projectId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        status: dto.status || MilestoneStatus.NOT_STARTED,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.MILESTONE,
      entityId: milestone.id,
      metadata: { name: milestone.name, projectId },
    });

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto, user: AuthenticatedUser) {
    const milestone = await this.findOne(id, user);

    const effectiveStart = dto.startDate ? new Date(dto.startDate) : milestone.startDate;
    const effectiveDue = dto.dueDate ? new Date(dto.dueDate) : milestone.dueDate;
    if (effectiveStart && effectiveDue && effectiveStart > effectiveDue) {
      throw new BadRequestException('Milestone start date cannot be later than due date.');
    }

    const updateData: Prisma.MilestoneUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim();
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const updated = await this.prisma.milestone.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.MILESTONE,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const milestone = await this.findOne(id, user);

    await this.prisma.milestone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.MILESTONE,
      entityId: id,
      metadata: { name: milestone.name, projectId: milestone.projectId },
    });

    return { success: true, message: 'Milestone deleted successfully.' };
  }
}
