import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateRecurringTaskDto,
  RecurringTaskQueryDto,
  UpdateRecurringTaskDto,
} from './dto/recurring-task.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import {
  AuditAction,
  AuditEntityType,
  Prisma,
  RecurrenceFrequency,
  TaskStatus,
} from '@prisma/client';

@Injectable()
export class RecurringTasksService {
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

  private calculateNextRun(
    currentRun: Date,
    frequency: RecurrenceFrequency,
    interval: number = 1,
  ): Date {
    const next = new Date(currentRun);
    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        next.setDate(next.getDate() + interval);
        break;
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + interval * 7);
        break;
      case RecurrenceFrequency.MONTHLY:
        next.setMonth(next.getMonth() + interval);
        break;
      case RecurrenceFrequency.CUSTOM:
      default:
        next.setDate(next.getDate() + interval * 7);
        break;
    }
    return next;
  }

  async create(projectId: string, dto: CreateRecurringTaskDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create recurring tasks on an archived project.');
    }

    const startDate = new Date(dto.startDate);
    const nextRunDate = startDate;

    const record = await this.prisma.recurringTaskDefinition.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        estimatedHours: dto.estimatedHours,
        milestoneId: dto.milestoneId || null,
        assigneeIds: dto.assigneeIds || [],
        frequency: dto.frequency,
        interval: dto.interval || 1,
        daysOfWeek: dto.daysOfWeek || [],
        dayOfMonth: dto.dayOfMonth || null,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextRunDate,
        isActive: true,
        timezone: dto.timezone || 'UTC',
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.RECURRING_TASK,
      entityId: record.id,
      metadata: {
        projectId,
        title: record.title,
        frequency: record.frequency,
      },
    });

    return record;
  }

  async findAll(projectId: string, query: RecurringTaskQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const { page = 1, limit = 20, isActive, frequency, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RecurringTaskDefinitionWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (isActive !== undefined) where.isActive = isActive;
    if (frequency) where.frequency = frequency;

    const [total, items] = await Promise.all([
      this.prisma.recurringTaskDefinition.count({ where }),
      this.prisma.recurringTaskDefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          milestone: { select: { id: true, name: true } },
        },
      }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const record = await this.prisma.recurringTaskDefinition.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        milestone: { select: { id: true, name: true } },
      },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundException(`Recurring task definition with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(record.projectId, user);
    return record;
  }

  async update(id: string, dto: UpdateRecurringTaskDto, user: AuthenticatedUser) {
    const existing = await this.prisma.recurringTaskDefinition.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Recurring task definition with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot update recurring task definition on an archived project.');
    }

    const data: Prisma.RecurringTaskDefinitionUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.estimatedHours !== undefined) data.estimatedHours = dto.estimatedHours;
    if (dto.milestoneId !== undefined) {
      data.milestone = dto.milestoneId ? { connect: { id: dto.milestoneId } } : { disconnect: true };
    }
    if (dto.assigneeIds !== undefined) data.assigneeIds = dto.assigneeIds;
    if (dto.frequency !== undefined) data.frequency = dto.frequency;
    if (dto.interval !== undefined) data.interval = dto.interval;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.prisma.recurringTaskDefinition.update({
      where: { id },
      data,
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.RECURRING_TASK,
      entityId: id,
      metadata: { projectId: updated.projectId, title: updated.title, isActive: updated.isActive },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.recurringTaskDefinition.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Recurring task definition with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot remove recurring task definition on an archived project.');
    }

    await this.prisma.recurringTaskDefinition.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.RECURRING_TASK,
      entityId: id,
      metadata: { projectId: existing.projectId, title: existing.title },
    });

    return { message: 'Recurring task definition removed.' };
  }

  /**
   * Generates next tasks for due active recurring task definitions
   */
  async generateDueTasks(projectId?: string) {
    const now = new Date();

    const where: Prisma.RecurringTaskDefinitionWhereInput = {
      isActive: true,
      deletedAt: null,
      nextRunDate: { lte: now },
      project: {
        status: { not: 'ARCHIVED' }, // Do not generate on archived projects
        deletedAt: null,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const dueDefinitions = await this.prisma.recurringTaskDefinition.findMany({
      where,
      include: { project: true },
    });

    const generatedTasks = [];

    for (const def of dueDefinitions) {
      // Check endDate constraint
      if (def.endDate && now > def.endDate) {
        await this.prisma.recurringTaskDefinition.update({
          where: { id: def.id },
          data: { isActive: false },
        });
        continue;
      }

      // Generate task instance in a transaction
      const task = await this.prisma.$transaction(async (tx) => {
        const lastTask = await tx.task.findFirst({
          where: { projectId: def.projectId },
          orderBy: { taskNumber: 'desc' },
          select: { taskNumber: true },
        });
        const taskNumber = (lastTask?.taskNumber || 0) + 1;

        // Due date set to next run + 1 day by default
        const dueDate = new Date(def.nextRunDate);
        dueDate.setDate(dueDate.getDate() + 1);

        const createdTask = await tx.task.create({
          data: {
            projectId: def.projectId,
            milestoneId: def.milestoneId,
            taskNumber,
            title: `${def.title} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
            description: def.description,
            priority: def.priority,
            estimatedHours: def.estimatedHours,
            status: TaskStatus.TODO,
            startDate: def.nextRunDate,
            dueDate,
            createdById: def.createdById,
            assignees: def.assigneeIds?.length
              ? {
                  create: def.assigneeIds.map((userId) => ({ userId })),
                }
              : undefined,
          },
        });

        const nextRun = this.calculateNextRun(def.nextRunDate, def.frequency, def.interval);

        await tx.recurringTaskDefinition.update({
          where: { id: def.id },
          data: {
            lastGeneratedDate: now,
            nextRunDate: nextRun,
          },
        });

        return createdTask;
      });

      generatedTasks.push(task);
    }

    return {
      generatedCount: generatedTasks.length,
      tasks: generatedTasks,
    };
  }
}
