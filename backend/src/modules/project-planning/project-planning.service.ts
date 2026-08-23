import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CalendarQueryDto, DeadlineQueryDto } from './dto/planning.dto';
import { Prisma, TaskStatus } from '@prisma/client';

@Injectable()
export class ProjectPlanningService {
  constructor(private readonly prisma: PrismaService) {}

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
   * 1. PROJECT PROGRESS ENGINE
   * Centralized effort-weighted calculation:
   * Progress = (Sum of Task Progress * Task Weight) / Total Weight
   * where Task Weight = max(estimatedHours, 1).
   * Subtasks rollup into parent task progress.
   */
  async calculateProjectProgress(projectId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    // Fetch all non-deleted top-level tasks and milestones
    const [milestones, topLevelTasks] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId, deletedAt: null },
        include: {
          tasks: {
            where: { parentTaskId: null, deletedAt: null },
            select: { id: true, progress: true, estimatedHours: true, status: true },
          },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, parentTaskId: null, deletedAt: null },
        select: {
          id: true,
          milestoneId: true,
          progress: true,
          estimatedHours: true,
          status: true,
        },
      }),
    ]);

    let totalWeight = 0;
    let weightedProgressSum = 0;
    let totalEstimatedHours = 0;
    let completedTasksCount = 0;

    for (const t of topLevelTasks) {
      if (t.status === TaskStatus.CANCELLED) continue;

      const weight = t.estimatedHours && t.estimatedHours > 0 ? t.estimatedHours : 1;
      const progress = t.status === TaskStatus.COMPLETED ? 100 : (t.progress || 0);

      totalWeight += weight;
      weightedProgressSum += progress * weight;
      totalEstimatedHours += t.estimatedHours || 0;

      if (t.status === TaskStatus.COMPLETED) {
        completedTasksCount += 1;
      }
    }

    const calculatedProgress = totalWeight > 0
      ? Math.round(weightedProgressSum / totalWeight)
      : 0;

    // Milestone-level progress calculations
    const milestoneProgressList = milestones.map((m) => {
      let mWeight = 0;
      let mProgressSum = 0;
      let mCompletedCount = 0;

      for (const t of m.tasks) {
        if (t.status === TaskStatus.CANCELLED) continue;
        const weight = t.estimatedHours && t.estimatedHours > 0 ? t.estimatedHours : 1;
        const progress = t.status === TaskStatus.COMPLETED ? 100 : (t.progress || 0);
        mWeight += weight;
        mProgressSum += progress * weight;
        if (t.status === TaskStatus.COMPLETED) mCompletedCount += 1;
      }

      const mProgress = mWeight > 0 ? Math.round(mProgressSum / mWeight) : 0;
      return {
        id: m.id,
        name: m.name,
        status: m.status,
        startDate: m.startDate,
        dueDate: m.dueDate,
        totalTasks: m.tasks.length,
        completedTasks: mCompletedCount,
        progress: mProgress,
      };
    });

    // Total actual logged minutes on this project
    const workLogAgg = await this.prisma.workLog.aggregate({
      where: { projectId, deletedAt: null },
      _sum: { durationMinutes: true },
    });
    const totalActualMinutes = workLogAgg._sum.durationMinutes || 0;
    const totalActualHours = Number((totalActualMinutes / 60).toFixed(2));

    // Record snapshot if history changed or empty
    const latestSnapshot = await this.prisma.progressHistory.findFirst({
      where: { projectId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!latestSnapshot || latestSnapshot.progress !== calculatedProgress) {
      await this.prisma.progressHistory.create({
        data: {
          projectId,
          progress: calculatedProgress,
          totalEstimatedHours,
          totalActualMinutes,
        },
      });
    }

    // Historical trend snapshots
    const history = await this.prisma.progressHistory.findMany({
      where: { projectId },
      orderBy: { recordedAt: 'asc' },
      take: 30,
    });

    return {
      projectId,
      projectName: project.name,
      projectCode: project.code,
      health: project.health,
      status: project.status,
      overallProgress: calculatedProgress,
      metrics: {
        totalTasks: topLevelTasks.length,
        completedTasks: completedTasksCount,
        totalEstimatedHours,
        totalActualMinutes,
        totalActualHours,
      },
      milestones: milestoneProgressList,
      history: history.map((h) => ({
        progress: h.progress,
        recordedAt: h.recordedAt,
        totalEstimatedHours: h.totalEstimatedHours,
        totalActualHours: h.totalActualMinutes ? Number((h.totalActualMinutes / 60).toFixed(1)) : 0,
      })),
    };
  }

  /**
   * 2. PROJECT TIMELINE & GANTT VIEW
   * Returns structured hierarchy: Milestone -> Task -> Subtasks with dates, durations, dependencies, progress
   */
  async getProjectTimeline(projectId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    const [milestones, unassignedTasks] = await Promise.all([
      this.prisma.milestone.findMany({
        where: { projectId, deletedAt: null },
        orderBy: { dueDate: 'asc' },
        include: {
          tasks: {
            where: { parentTaskId: null, deletedAt: null },
            orderBy: { taskNumber: 'asc' },
            include: {
              assignees: {
                include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
              },
              dependencies: {
                include: { dependsOnTask: { select: { id: true, taskNumber: true, title: true } } },
              },
              dependedOnBy: {
                include: { task: { select: { id: true, taskNumber: true, title: true } } },
              },
              subtasks: {
                where: { deletedAt: null },
                orderBy: { taskNumber: 'asc' },
                include: {
                  assignees: {
                    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, milestoneId: null, parentTaskId: null, deletedAt: null },
        orderBy: { taskNumber: 'asc' },
        include: {
          assignees: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          },
          dependencies: {
            include: { dependsOnTask: { select: { id: true, taskNumber: true, title: true } } },
          },
          dependedOnBy: {
            include: { task: { select: { id: true, taskNumber: true, title: true } } },
          },
          subtasks: {
            where: { deletedAt: null },
            orderBy: { taskNumber: 'asc' },
            include: {
              assignees: {
                include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
              },
            },
          },
        },
      }),
    ]);

    const formatTask = (t: any) => {
      const start = t.startDate ? new Date(t.startDate) : null;
      const end = t.dueDate ? new Date(t.dueDate) : null;
      let durationDays = 1;
      if (start && end) {
        durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        startDate: t.startDate,
        dueDate: t.dueDate,
        durationDays,
        estimatedHours: t.estimatedHours,
        assignees: t.assignees.map((a: any) => a.user),
        dependencies: t.dependencies.map((d: any) => ({
          type: d.dependencyType,
          dependsOnTaskId: d.dependsOnTaskId,
          dependsOnTaskNumber: d.dependsOnTask.taskNumber,
          dependsOnTitle: d.dependsOnTask.title,
        })),
        blocking: t.dependedOnBy.map((d: any) => ({
          blockedTaskId: d.taskId,
          blockedTaskNumber: d.task.taskNumber,
          blockedTitle: d.task.title,
        })),
        subtasks: t.subtasks.map((s: any) => ({
          id: s.id,
          taskNumber: s.taskNumber,
          title: s.title,
          status: s.status,
          priority: s.priority,
          progress: s.progress,
          startDate: s.startDate,
          dueDate: s.dueDate,
          assignees: s.assignees.map((a: any) => a.user),
        })),
      };
    };

    const tree = [
      ...milestones.map((m) => {
        const start = m.startDate ? new Date(m.startDate) : null;
        const end = m.dueDate ? new Date(m.dueDate) : null;
        let durationDays = 1;
        if (start && end) {
          durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        }

        const taskCount = m.tasks.length;
        const completedCount = m.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
        const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

        return {
          type: 'MILESTONE',
          id: m.id,
          name: m.name,
          status: m.status,
          startDate: m.startDate,
          dueDate: m.dueDate,
          durationDays,
          progress,
          tasks: m.tasks.map(formatTask),
        };
      }),
      ...(unassignedTasks.length > 0
        ? [
            {
              type: 'MILESTONE',
              id: 'general-tasks',
              name: 'General / Unassigned Milestone',
              status: 'IN_PROGRESS',
              startDate: project.startDate,
              dueDate: project.targetDate,
              durationDays: 30,
              progress: 0,
              tasks: unassignedTasks.map(formatTask),
            },
          ]
        : []),
    ];

    return {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        startDate: project.startDate,
        targetDate: project.targetDate,
      },
      tree,
    };
  }

  /**
   * 3. PROJECT CALENDAR FEED
   */
  async getProjectCalendar(projectId: string, query: CalendarQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const { startDate, endDate, assigneeId, milestoneId } = query;

    const taskWhere: Prisma.TaskWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (assigneeId) {
      taskWhere.assignees = { some: { userId: assigneeId } };
    }

    if (milestoneId) {
      taskWhere.milestoneId = milestoneId;
    }

    if (startDate || endDate) {
      taskWhere.OR = [
        {
          startDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
        {
          dueDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
      ];
    }

    const milestoneWhere: Prisma.MilestoneWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (milestoneId) {
      milestoneWhere.id = milestoneId;
    }

    if (startDate || endDate) {
      milestoneWhere.OR = [
        {
          startDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
        {
          dueDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
      ];
    }

    const [tasks, milestones] = await Promise.all([
      this.prisma.task.findMany({
        where: taskWhere,
        include: {
          milestone: { select: { id: true, name: true } },
          assignees: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.milestone.findMany({
        where: milestoneWhere,
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const events = [
      ...milestones.map((m) => ({
        id: m.id,
        entityType: 'MILESTONE',
        title: m.name,
        startDate: m.startDate,
        dueDate: m.dueDate,
        status: m.status,
        isMilestone: true,
      })),
      ...tasks.map((t) => ({
        id: t.id,
        entityType: 'TASK',
        taskNumber: t.taskNumber,
        title: `#${t.taskNumber} - ${t.title}`,
        startDate: t.startDate,
        dueDate: t.dueDate,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        milestone: t.milestone,
        assignees: t.assignees.map((a) => a.user),
        isMilestone: false,
      })),
    ];

    return {
      events,
    };
  }

  /**
   * 4. PROJECT TIME SUMMARY
   */
  async getProjectTimeSummary(projectId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    const [tasks, workLogs] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId, parentTaskId: null, deletedAt: null },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          estimatedHours: true,
          status: true,
          progress: true,
        },
      }),
      this.prisma.workLog.findMany({
        where: { projectId, deletedAt: null },
        select: {
          taskId: true,
          durationMinutes: true,
        },
      }),
    ]);

    const taskMinutesMap = new Map<string, number>();
    let totalActualMinutes = 0;

    for (const log of workLogs) {
      taskMinutesMap.set(log.taskId, (taskMinutesMap.get(log.taskId) || 0) + log.durationMinutes);
      totalActualMinutes += log.durationMinutes;
    }

    let totalEstimatedHours = 0;
    let overEstimateTasksCount = 0;
    const overEstimateTasks = [];

    for (const t of tasks) {
      const estimated = t.estimatedHours || 0;
      const loggedMinutes = taskMinutesMap.get(t.id) || 0;
      const loggedHours = Number((loggedMinutes / 60).toFixed(1));

      totalEstimatedHours += estimated;

      if (loggedHours > estimated && estimated > 0) {
        overEstimateTasksCount += 1;
        overEstimateTasks.push({
          id: t.id,
          taskNumber: t.taskNumber,
          title: t.title,
          estimatedHours: estimated,
          loggedHours,
          overHours: Number((loggedHours - estimated).toFixed(1)),
        });
      }
    }

    const totalActualHours = Number((totalActualMinutes / 60).toFixed(1));
    const remainingEstimatedHours = Math.max(0, Number((totalEstimatedHours - totalActualHours).toFixed(1)));

    return {
      projectId,
      projectName: project.name,
      projectCode: project.code,
      totalEstimatedHours,
      totalActualMinutes,
      totalActualHours,
      remainingEstimatedHours,
      overEstimateTasksCount,
      overEstimateTasks,
    };
  }

  /**
   * 5. CENTRALIZED DEADLINE & OVERDUE MONITOR
   */
  async getDeadlines(query: DeadlineQueryDto, user: AuthenticatedUser) {
    const { projectId, assigneeId } = query;

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      status: {
        notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      },
    };

    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assignees = { some: { userId: assigneeId } };

    if (!this.isElevatedUser(user)) {
      where.project = {
        members: { some: { userId: user.id } },
      };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const dueSoonCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 23, 59, 59, 999));

    const overdue = [];
    const dueToday = [];
    const dueSoon = [];
    const noDueDate = [];

    for (const t of tasks) {
      const formatted = {
        ...t,
        assignees: t.assignees.map((a) => a.user),
      };

      if (!t.dueDate) {
        noDueDate.push(formatted);
      } else {
        const due = new Date(t.dueDate);
        if (due < startOfToday) {
          overdue.push(formatted);
        } else if (due >= startOfToday && due <= endOfToday) {
          dueToday.push(formatted);
        } else if (due > endOfToday && due <= dueSoonCutoff) {
          dueSoon.push(formatted);
        }
      }
    }

    return {
      metrics: {
        totalOpenTasks: tasks.length,
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        dueSoonCount: dueSoon.length,
        noDueDateCount: noDueDate.length,
      },
      overdue,
      dueToday,
      dueSoon,
      noDueDate,
    };
  }
}
