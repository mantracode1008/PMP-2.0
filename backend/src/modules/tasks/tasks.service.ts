import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, Prisma, TaskStatus, TaskPriority, UserStatus } from '@prisma/client';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TasksService {
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

  /**
   * Recalculates parent task progress if subtasks exist
   */
  private async syncParentProgress(parentTaskId: string) {
    const subtasks = await this.prisma.task.findMany({
      where: { parentTaskId, deletedAt: null },
      select: { progress: true, status: true },
    });

    if (subtasks.length === 0) return;

    const totalProgress = subtasks.reduce((sum, s) => sum + s.progress, 0);
    const avgProgress = Math.round(totalProgress / subtasks.length);

    const allCompleted = subtasks.every((s) => s.status === TaskStatus.COMPLETED);

    await this.prisma.task.update({
      where: { id: parentTaskId },
      data: {
        progress: avgProgress,
        status: allCompleted ? TaskStatus.COMPLETED : undefined,
      },
    });
  }

  async findAllByProject(projectId: string, query: TaskQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const {
      page = 1,
      limit = 50,
      search,
      status,
      priority,
      milestoneId,
      assigneeId,
      parentOnly,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const conditions: Prisma.TaskWhereInput[] = [
      { projectId, deletedAt: null },
    ];

    if (status) conditions.push({ status });
    if (priority) conditions.push({ priority });
    if (milestoneId) conditions.push({ milestoneId });
    if (parentOnly) conditions.push({ parentTaskId: null });
    if (assigneeId) {
      conditions.push({
        assignees: { some: { userId: assigneeId } },
      });
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.TaskWhereInput = { AND: conditions };

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          milestone: { select: { id: true, name: true, status: true } },
          assignees: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: {
              subtasks: { where: { deletedAt: null } },
              comments: { where: { deletedAt: null } },
              attachments: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const formatted = tasks.map((t) => ({
      ...t,
      subtaskCount: t._count.subtasks,
      commentCount: t._count.comments,
      attachmentCount: t._count.attachments,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: true,
        parentTask: { select: { id: true, taskNumber: true, title: true } },
        subtasks: {
          where: { deletedAt: null },
          include: {
            assignees: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
          },
          orderBy: { taskNumber: 'asc' },
        },
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: { id: true, taskNumber: true, title: true, status: true, priority: true },
            },
          },
        },
        dependedOnBy: {
          include: {
            task: {
              select: { id: true, taskNumber: true, title: true, status: true, priority: true },
            },
          },
        },
        comments: {
          where: { deletedAt: null },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          where: { deletedAt: null },
          include: {
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(task.projectId, user);
    return task;
  }

  async create(projectId: string, dto: CreateTaskDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create tasks on an archived project.');
    }

    if (dto.startDate && dto.dueDate && new Date(dto.startDate) > new Date(dto.dueDate)) {
      throw new BadRequestException('Task start date cannot be later than due date.');
    }

    // Next task number in project
    const latestTask = await this.prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });
    const taskNumber = (latestTask?.taskNumber || 0) + 1;

    let initialProgress = dto.progress ?? 0;
    if (dto.status === TaskStatus.COMPLETED) {
      initialProgress = 100;
    }

    // Verify assignees if provided
    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      const validUsers = await this.prisma.user.findMany({
        where: { id: { in: dto.assigneeIds }, status: UserStatus.ACTIVE, deletedAt: null },
        select: { id: true },
      });
      if (validUsers.length !== dto.assigneeIds.length) {
        throw new BadRequestException('One or more assignees are invalid or inactive.');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        taskNumber,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        milestoneId: dto.milestoneId || null,
        parentTaskId: dto.parentTaskId || null,
        status: dto.status || TaskStatus.TODO,
        priority: dto.priority || TaskPriority.MEDIUM,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimatedHours: dto.estimatedHours || null,
        progress: initialProgress,
        createdById: user.id,
        assignees: dto.assigneeIds
          ? {
              create: dto.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (task.parentTaskId) {
      await this.syncParentProgress(task.parentTaskId);
    }

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TASK,
      entityId: task.id,
      metadata: { taskNumber: task.taskNumber, title: task.title, projectId },
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: AuthenticatedUser) {
    const task = await this.findOne(id, user);

    const effectiveStart = dto.startDate ? new Date(dto.startDate) : task.startDate;
    const effectiveDue = dto.dueDate ? new Date(dto.dueDate) : task.dueDate;
    if (effectiveStart && effectiveDue && effectiveStart > effectiveDue) {
      throw new BadRequestException('Task start date cannot be later than due date.');
    }

    const updateData: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim();
    if (dto.milestoneId !== undefined) {
      updateData.milestone = dto.milestoneId ? { connect: { id: dto.milestoneId } } : { disconnect: true };
    }
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === TaskStatus.COMPLETED) {
        updateData.progress = 100;
      }
    }

    if (dto.progress !== undefined && dto.status !== TaskStatus.COMPLETED) {
      updateData.progress = dto.progress;
      if (dto.progress === 100) {
        updateData.status = TaskStatus.COMPLETED;
      }
    }

    if (dto.assigneeIds !== undefined) {
      await this.prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (dto.assigneeIds.length > 0) {
        updateData.assignees = {
          create: dto.assigneeIds.map((userId) => ({ userId })),
        };
      }
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (updated.parentTaskId) {
      await this.syncParentProgress(updated.parentTaskId);
    }

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TASK,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: AuthenticatedUser) {
    const task = await this.findOne(id, user);

    const progress = dto.status === TaskStatus.COMPLETED ? 100 : task.progress === 100 ? 0 : task.progress;

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status,
        progress,
      },
    });

    if (updated.parentTaskId) {
      await this.syncParentProgress(updated.parentTaskId);
    }

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.TASK,
      entityId: id,
      metadata: { from: task.status, to: dto.status },
    });

    return updated;
  }

  async assign(id: string, dto: AssignTaskDto, user: AuthenticatedUser) {
    await this.findOne(id, user);

    // Delete existing and set new assignees
    await this.prisma.taskAssignee.deleteMany({ where: { taskId: id } });

    if (dto.userIds.length > 0) {
      await this.prisma.taskAssignee.createMany({
        data: dto.userIds.map((userId) => ({
          taskId: id,
          userId,
        })),
        skipDuplicates: true,
      });
    }

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.ASSIGN,
      entityType: AuditEntityType.TASK,
      entityId: id,
      metadata: { userIds: dto.userIds },
    });

    return this.findOne(id, user);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const task = await this.findOne(id, user);

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (task.parentTaskId) {
      await this.syncParentProgress(task.parentTaskId);
    }

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.TASK,
      entityId: id,
      metadata: { title: task.title, taskNumber: task.taskNumber },
    });

    return { success: true, message: 'Task archived successfully.' };
  }
}
