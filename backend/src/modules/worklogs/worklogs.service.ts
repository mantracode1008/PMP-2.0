import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateWorkLogDto, UpdateWorkLogDto, WorkLogQueryDto } from './dto/worklog.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, Prisma, ProjectStatus, TimesheetStatus } from '@prisma/client';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class WorkLogsService {
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
   * Helper to get start (Monday 00:00:00) and end (Sunday 23:59:59) of the week for a given date
   */
  private getWeekBounds(date: Date): { startOfWeek: Date; endOfWeek: Date } {
    const d = new Date(date);
    const day = d.getUTCDay();
    // Monday is day 1, Sunday is day 0
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday, 0, 0, 0, 0));
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 23, 59, 59, 999));
    return { startOfWeek: monday, endOfWeek: sunday };
  }

  private async verifyProjectAndTask(projectId: string, taskId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Cannot log time on an archived project.');
    }

    if (!this.isElevatedUser(user)) {
      const isMember = project.members.some((m) => m.userId === user.id);
      const isOwner = project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('You do not have access to this project.');
      }
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task with ID "${taskId}" not found.`);
    }

    if (task.projectId !== projectId) {
      throw new BadRequestException('Task does not belong to the specified project.');
    }

    return { project, task };
  }

  private async verifyTimesheetUnlocked(userId: string, date: Date) {
    const { startOfWeek } = this.getWeekBounds(date);
    const timesheet = await this.prisma.timesheet.findUnique({
      where: {
        userId_startDate: {
          userId,
          startDate: startOfWeek,
        },
      },
    });

    if (timesheet && (timesheet.status === TimesheetStatus.APPROVED || timesheet.status === TimesheetStatus.LOCKED)) {
      throw new BadRequestException(
        `Cannot modify work logs for this week because timesheet is already ${timesheet.status.toLowerCase()}.`,
      );
    }

    return timesheet;
  }

  async create(projectId: string, taskId: string, dto: CreateWorkLogDto, user: AuthenticatedUser) {
    const { project, task } = await this.verifyProjectAndTask(projectId, taskId, user);

    const logDate = new Date(dto.date);
    const now = new Date();
    // Max 14 days in future
    const maxFutureDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (logDate > maxFutureDate) {
      throw new BadRequestException('Cannot log time more than 14 days in the future.');
    }

    const timesheet = await this.verifyTimesheetUnlocked(user.id, logDate);

    const workLog = await this.prisma.workLog.create({
      data: {
        userId: user.id,
        projectId,
        taskId,
        timesheetId: timesheet ? timesheet.id : undefined,
        date: logDate,
        durationMinutes: dto.durationMinutes,
        description: dto.description?.trim(),
        billable: dto.billable ?? true,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.WORK_LOG,
      entityId: workLog.id,
      metadata: {
        durationMinutes: dto.durationMinutes,
        taskNumber: task.taskNumber,
        projectCode: project.code,
      },
    });

    return workLog;
  }

  async findAll(query: WorkLogQueryDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 50,
      userId,
      projectId,
      taskId,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const conditions: Prisma.WorkLogWhereInput[] = [{ deletedAt: null }];

    if (!this.isElevatedUser(user)) {
      // Non-admins can only see their own work logs or logs on projects they are a member of
      if (userId && userId !== user.id) {
        throw new ForbiddenException('You can only view your own work logs or project team logs.');
      }
      conditions.push({
        OR: [
          { userId: user.id },
          { project: { members: { some: { userId: user.id } } } },
        ],
      });
    }

    if (userId) conditions.push({ userId });
    if (projectId) conditions.push({ projectId });
    if (taskId) conditions.push({ taskId });
    if (startDate) conditions.push({ date: { gte: new Date(startDate) } });
    if (endDate) conditions.push({ date: { lte: new Date(endDate) } });

    const where: Prisma.WorkLogWhereInput = { AND: conditions };

    const [total, items, aggregations] = await Promise.all([
      this.prisma.workLog.count({ where }),
      this.prisma.workLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, code: true } },
          task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
        },
      }),
      this.prisma.workLog.aggregate({
        where,
        _sum: { durationMinutes: true },
      }),
    ]);

    const totalMinutes = aggregations._sum.durationMinutes || 0;
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    const result = createPaginatedResult(items, total, page, limit);
    return {
      ...result,
      meta: {
        ...result.meta,
        totalMinutes,
        totalHours,
      },
    };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, code: true, members: true, ownerId: true } },
        task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
      },
    });

    if (!workLog || workLog.deletedAt) {
      throw new NotFoundException(`Work log with ID "${id}" not found.`);
    }

    if (!this.isElevatedUser(user)) {
      const isMember = workLog.project.members.some((m) => m.userId === user.id);
      const isOwner = workLog.project.ownerId === user.id;
      const isAuthor = workLog.userId === user.id;
      if (!isMember && !isOwner && !isAuthor) {
        throw new ForbiddenException('You do not have access to this work log.');
      }
    }

    return workLog;
  }

  async update(id: string, dto: UpdateWorkLogDto, user: AuthenticatedUser) {
    const workLog = await this.findOne(id, user);

    if (workLog.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only edit your own work logs.');
    }

    const effectiveDate = dto.date ? new Date(dto.date) : workLog.date;
    await this.verifyTimesheetUnlocked(workLog.userId, effectiveDate);

    const updateData: Prisma.WorkLogUpdateInput = {};
    if (dto.date !== undefined) updateData.date = new Date(dto.date);
    if (dto.durationMinutes !== undefined) updateData.durationMinutes = dto.durationMinutes;
    if (dto.description !== undefined) updateData.description = dto.description?.trim();
    if (dto.billable !== undefined) updateData.billable = dto.billable;

    const updated = await this.prisma.workLog.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.WORK_LOG,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const workLog = await this.findOne(id, user);

    if (workLog.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only delete your own work logs.');
    }

    await this.verifyTimesheetUnlocked(workLog.userId, workLog.date);

    await this.prisma.workLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.WORK_LOG,
      entityId: id,
      metadata: { durationMinutes: workLog.durationMinutes, taskId: workLog.taskId },
    });

    return { success: true, message: 'Work log deleted successfully.' };
  }

  async getTaskTimeSummary(taskId: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException('Task not found.');
    }

    if (!this.isElevatedUser(user)) {
      const isMember = task.project.members.some((m) => m.userId === user.id);
      const isOwner = task.project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('Access denied to task project.');
      }
    }

    const aggregations = await this.prisma.workLog.aggregate({
      where: { taskId, deletedAt: null },
      _sum: { durationMinutes: true },
    });

    const loggedMinutes = aggregations._sum.durationMinutes || 0;
    const loggedHours = Number((loggedMinutes / 60).toFixed(2));
    const estimatedHours = task.estimatedHours || 0;

    const remainingHours = Math.max(0, Number((estimatedHours - loggedHours).toFixed(2)));
    const overEstimateHours = loggedHours > estimatedHours ? Number((loggedHours - estimatedHours).toFixed(2)) : 0;

    return {
      taskId,
      estimatedHours,
      loggedMinutes,
      loggedHours,
      remainingHours,
      overEstimateHours,
      isOverEstimate: loggedHours > estimatedHours && estimatedHours > 0,
    };
  }
}
