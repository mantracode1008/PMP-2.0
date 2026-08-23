import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RejectTimesheetDto, TimesheetQueryDto } from './dto/timesheet.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, Prisma, TimesheetStatus } from '@prisma/client';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TimesheetsService {
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

  private getWeekBounds(date: Date): { startOfWeek: Date; endOfWeek: Date } {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diffToMonday, 0, 0, 0, 0));
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 23, 59, 59, 999));
    return { startOfWeek: monday, endOfWeek: sunday };
  }

  async getMyWeeklyTimesheet(user: AuthenticatedUser, weekDateStr?: string) {
    const targetDate = weekDateStr ? new Date(weekDateStr) : new Date();
    const { startOfWeek, endOfWeek } = this.getWeekBounds(targetDate);

    // Find or create timesheet for this week
    let timesheet = await this.prisma.timesheet.findUnique({
      where: {
        userId_startDate: {
          userId: user.id,
          startDate: startOfWeek,
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!timesheet) {
      timesheet = await this.prisma.timesheet.create({
        data: {
          userId: user.id,
          startDate: startOfWeek,
          endDate: endOfWeek,
          status: TimesheetStatus.DRAFT,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    }

    // Link any unlinked work logs for this user in this date range
    await this.prisma.workLog.updateMany({
      where: {
        userId: user.id,
        date: { gte: startOfWeek, lte: endOfWeek },
        timesheetId: null,
        deletedAt: null,
      },
      data: {
        timesheetId: timesheet.id,
      },
    });

    // Fetch all active work logs for this timesheet
    const workLogs = await this.prisma.workLog.findMany({
      where: {
        timesheetId: timesheet.id,
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Group logs by task and day for spreadsheet rendering
    const taskMap = new Map<string, {
      task: any;
      project: any;
      days: { [dayIndex: number]: { durationMinutes: number; logIds: string[] } };
      totalMinutes: number;
    }>();

    const dailyTotals: { [dayIndex: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    let weeklyTotalMinutes = 0;

    for (const log of workLogs) {
      const logDate = new Date(log.date);
      const dayOfWeek = logDate.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

      dailyTotals[dayOfWeek] = (dailyTotals[dayOfWeek] || 0) + log.durationMinutes;
      weeklyTotalMinutes += log.durationMinutes;

      if (!taskMap.has(log.taskId)) {
        taskMap.set(log.taskId, {
          task: log.task,
          project: log.project,
          days: {},
          totalMinutes: 0,
        });
      }

      const taskEntry = taskMap.get(log.taskId)!;
      if (!taskEntry.days[dayOfWeek]) {
        taskEntry.days[dayOfWeek] = { durationMinutes: 0, logIds: [] };
      }
      taskEntry.days[dayOfWeek].durationMinutes += log.durationMinutes;
      taskEntry.days[dayOfWeek].logIds.push(log.id);
      taskEntry.totalMinutes += log.durationMinutes;
    }

    return {
      timesheet: {
        ...timesheet,
        weeklyTotalMinutes,
        weeklyTotalHours: Number((weeklyTotalMinutes / 60).toFixed(2)),
      },
      dailyTotals: {
        monday: { minutes: dailyTotals[1] || 0, hours: Number(((dailyTotals[1] || 0) / 60).toFixed(2)) },
        tuesday: { minutes: dailyTotals[2] || 0, hours: Number(((dailyTotals[2] || 0) / 60).toFixed(2)) },
        wednesday: { minutes: dailyTotals[3] || 0, hours: Number(((dailyTotals[3] || 0) / 60).toFixed(2)) },
        thursday: { minutes: dailyTotals[4] || 0, hours: Number(((dailyTotals[4] || 0) / 60).toFixed(2)) },
        friday: { minutes: dailyTotals[5] || 0, hours: Number(((dailyTotals[5] || 0) / 60).toFixed(2)) },
        saturday: { minutes: dailyTotals[6] || 0, hours: Number(((dailyTotals[6] || 0) / 60).toFixed(2)) },
        sunday: { minutes: dailyTotals[0] || 0, hours: Number(((dailyTotals[0] || 0) / 60).toFixed(2)) },
      },
      taskRows: Array.from(taskMap.values()).map((row) => ({
        ...row,
        totalHours: Number((row.totalMinutes / 60).toFixed(2)),
      })),
      rawWorkLogs: workLogs,
    };
  }

  async findAll(query: TimesheetQueryDto, user: AuthenticatedUser) {
    const { page = 1, limit = 20, userId, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const conditions: Prisma.TimesheetWhereInput[] = [{ deletedAt: null }];

    if (!this.isElevatedUser(user)) {
      conditions.push({ userId: user.id });
    } else if (userId) {
      conditions.push({ userId });
    }

    if (status) conditions.push({ status });
    if (startDate) conditions.push({ startDate: { gte: new Date(startDate) } });
    if (endDate) conditions.push({ endDate: { lte: new Date(endDate) } });

    const where: Prisma.TimesheetWhereInput = { AND: conditions };

    const [total, timesheets] = await Promise.all([
      this.prisma.timesheet.count({ where }),
      this.prisma.timesheet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          _count: {
            select: { workLogs: { where: { deletedAt: null } } },
          },
        },
      }),
    ]);

    // Aggregate durations for returned timesheets
    const timesheetIds = timesheets.map((t) => t.id);
    const durationSums = await this.prisma.workLog.groupBy({
      by: ['timesheetId'],
      where: {
        timesheetId: { in: timesheetIds },
        deletedAt: null,
      },
      _sum: { durationMinutes: true },
    });

    const durationMap = new Map<string, number>();
    for (const d of durationSums) {
      if (d.timesheetId) durationMap.set(d.timesheetId, d._sum.durationMinutes || 0);
    }

    const formatted = timesheets.map((t) => {
      const totalMinutes = durationMap.get(t.id) || 0;
      return {
        ...t,
        workLogCount: t._count.workLogs,
        totalMinutes,
        totalHours: Number((totalMinutes / 60).toFixed(2)),
        _count: undefined,
      };
    });

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        workLogs: {
          where: { deletedAt: null },
          include: {
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true } },
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!timesheet || timesheet.deletedAt) {
      throw new NotFoundException(`Timesheet with ID "${id}" not found.`);
    }

    if (timesheet.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You do not have access to view this timesheet.');
    }

    const totalMinutes = timesheet.workLogs.reduce((acc, log) => acc + log.durationMinutes, 0);

    return {
      ...timesheet,
      totalMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(2)),
    };
  }

  async submit(id: string, user: AuthenticatedUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
      include: { workLogs: { where: { deletedAt: null } } },
    });

    if (!timesheet || timesheet.deletedAt) {
      throw new NotFoundException(`Timesheet with ID "${id}" not found.`);
    }

    if (timesheet.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only submit your own timesheet.');
    }

    if (timesheet.status !== TimesheetStatus.DRAFT && timesheet.status !== TimesheetStatus.REJECTED) {
      throw new BadRequestException(`Cannot submit timesheet with status "${timesheet.status}".`);
    }

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.SUBMITTED,
        submittedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.SUBMIT,
      entityType: AuditEntityType.TIMESHEET,
      entityId: id,
      metadata: {
        startDate: timesheet.startDate,
        endDate: timesheet.endDate,
        workLogCount: timesheet.workLogs.length,
      },
    });

    return updated;
  }

  async approve(id: string, user: AuthenticatedUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet || timesheet.deletedAt) {
      throw new NotFoundException(`Timesheet with ID "${id}" not found.`);
    }

    // Security check: cannot approve own timesheet unless Super Admin
    if (timesheet.userId === user.id && !user.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('You cannot approve your own timesheet.');
    }

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(`Only submitted timesheets can be approved. Current status: ${timesheet.status}`);
    }

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.APPROVED,
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.APPROVE,
      entityType: AuditEntityType.TIMESHEET,
      entityId: id,
      metadata: { userId: timesheet.userId },
    });

    return updated;
  }

  async reject(id: string, dto: RejectTimesheetDto, user: AuthenticatedUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet || timesheet.deletedAt) {
      throw new NotFoundException(`Timesheet with ID "${id}" not found.`);
    }

    if (timesheet.userId === user.id && !user.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('You cannot reject your own timesheet.');
    }

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      throw new BadRequestException(`Only submitted timesheets can be rejected. Current status: ${timesheet.status}`);
    }

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.REJECTED,
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: dto.rejectionReason.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.REJECT,
      entityType: AuditEntityType.TIMESHEET,
      entityId: id,
      metadata: { reason: dto.rejectionReason },
    });

    return updated;
  }

  async lock(id: string, user: AuthenticatedUser) {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet || timesheet.deletedAt) {
      throw new NotFoundException(`Timesheet with ID "${id}" not found.`);
    }

    if (timesheet.status !== TimesheetStatus.APPROVED) {
      throw new BadRequestException(`Only approved timesheets can be locked. Current status: ${timesheet.status}`);
    }

    const updated = await this.prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.LOCKED,
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.LOCK,
      entityType: AuditEntityType.TIMESHEET,
      entityId: id,
    });

    return updated;
  }
}
