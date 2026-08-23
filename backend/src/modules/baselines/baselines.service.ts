import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { BaselineQueryDto, CreateBaselineDto } from './dto/baseline.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, Prisma, TaskStatus } from '@prisma/client';

@Injectable()
export class BaselinesService {
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
   * Capture an immutable project baseline snapshot
   */
  async create(projectId: string, dto: CreateBaselineDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create baselines on an archived project.');
    }

    // Fetch live project milestones & tasks
    const [milestones, tasks] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId, deletedAt: null },
        include: {
          tasks: {
            where: { deletedAt: null },
            select: { id: true, taskNumber: true, title: true, priority: true, estimatedHours: true, dueDate: true, status: true },
          },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, milestoneId: true, taskNumber: true, title: true, priority: true, estimatedHours: true, dueDate: true, status: true },
      }),
    ]);

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    const lastBaseline = await this.prisma.projectBaseline.findFirst({
      where: { projectId },
      orderBy: { baselineNumber: 'desc' },
      select: { baselineNumber: true },
    });
    const baselineNumber = (lastBaseline?.baselineNumber || 0) + 1;

    // Serialize full planning structure into frozen JSON snapshot
    const snapshotData = {
      project: {
        code: project.code,
        name: project.name,
        startDate: project.startDate,
        targetDate: project.targetDate,
      },
      milestones: milestones.map((m) => ({
        id: m.id,
        name: m.name,
        startDate: m.startDate,
        dueDate: m.dueDate,
        tasksCount: m.tasks.length,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        milestoneId: t.milestoneId,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        dueDate: t.dueDate,
      })),
      capturedAt: new Date(),
    };

    const baseline = await this.prisma.projectBaseline.create({
      data: {
        projectId,
        baselineNumber,
        name: dto.name,
        description: dto.description,
        createdById: user.id,
        snapshot: {
          create: {
            totalTasks: tasks.length,
            totalMilestones: milestones.length,
            totalEstimatedHours,
            plannedStartDate: project.startDate,
            plannedEndDate: project.targetDate,
            snapshotData: snapshotData as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        snapshot: true,
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PROJECT_BASELINE,
      entityId: baseline.id,
      metadata: {
        projectId,
        baselineNumber,
        name: baseline.name,
        totalTasks: tasks.length,
        totalHours: totalEstimatedHours,
      },
    });

    return baseline;
  }

  async findAll(projectId: string, query: BaselineQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const { page = 1, limit = 20, search, sortBy = 'baselineNumber', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectBaselineWhereInput = { projectId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.projectBaseline.count({ where }),
      this.prisma.projectBaseline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          snapshot: {
            select: {
              totalTasks: true,
              totalMilestones: true,
              totalEstimatedHours: true,
              plannedStartDate: true,
              plannedEndDate: true,
            },
          },
        },
      }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const baseline = await this.prisma.projectBaseline.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true, targetDate: true, startDate: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        snapshot: true,
      },
    });

    if (!baseline) {
      throw new NotFoundException(`Project baseline with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(baseline.projectId, user);
    return baseline;
  }

  /**
   * Compare a baseline snapshot against current live project data
   */
  async compareBaseline(projectId: string, baselineId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    const baseline = await this.prisma.projectBaseline.findUnique({
      where: { id: baselineId },
      include: { snapshot: true },
    });

    if (!baseline || baseline.projectId !== projectId || !baseline.snapshot) {
      throw new NotFoundException('Project baseline snapshot not found.');
    }

    // Fetch current project metrics
    const [currentMilestones, currentTasks] = await Promise.all([
      this.prisma.milestone.findMany({ where: { projectId, deletedAt: null } }),
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, taskNumber: true, title: true, estimatedHours: true, status: true },
      }),
    ]);

    const currentTotalHours = currentTasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);

    const snapshot = baseline.snapshot;
    const originalHours = snapshot.totalEstimatedHours;
    const originalEndDate = snapshot.plannedEndDate ? new Date(snapshot.plannedEndDate) : null;
    const currentEndDate = project.targetDate ? new Date(project.targetDate) : null;

    let scheduleVarianceDays = 0;
    if (originalEndDate && currentEndDate) {
      const diffTime = currentEndDate.getTime() - originalEndDate.getTime();
      scheduleVarianceDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    const effortVarianceHours = Number((currentTotalHours - originalHours).toFixed(2));
    const taskCountVariance = currentTasks.length - snapshot.totalTasks;
    const milestoneCountVariance = currentMilestones.length - snapshot.totalMilestones;

    return {
      baseline: {
        id: baseline.id,
        number: baseline.baselineNumber,
        name: baseline.name,
        createdAt: baseline.createdAt,
        plannedStartDate: snapshot.plannedStartDate,
        plannedEndDate: snapshot.plannedEndDate,
        estimatedHours: originalHours,
        totalTasks: snapshot.totalTasks,
        totalMilestones: snapshot.totalMilestones,
      },
      current: {
        startDate: project.startDate,
        targetDate: project.targetDate,
        estimatedHours: currentTotalHours,
        totalTasks: currentTasks.length,
        totalMilestones: currentMilestones.length,
      },
      variance: {
        scheduleVarianceDays, // positive = delayed, negative = ahead of schedule
        effortVarianceHours, // positive = scope expansion, negative = scope reduction
        taskCountVariance,
        milestoneCountVariance,
      },
    };
  }
}
