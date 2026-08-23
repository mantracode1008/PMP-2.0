import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class MyWorkService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyWork(user: AuthenticatedUser) {
    const tasks = await this.prisma.task.findMany({
      where: {
        assignees: { some: { userId: user.id } },
        deletedAt: null,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        milestone: { select: { id: true, name: true } },
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
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
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const overdue = [];
    const today = [];
    const upcoming = [];
    const inProgress = [];
    const waitingReview = [];
    const completed = [];

    for (const task of tasks) {
      const formatted = {
        ...task,
        subtaskCount: task._count.subtasks,
        commentCount: task._count.comments,
        attachmentCount: task._count.attachments,
        _count: undefined,
      };

      if (task.status === TaskStatus.COMPLETED) {
        completed.push(formatted);
      } else if (task.status === TaskStatus.IN_REVIEW || task.status === TaskStatus.QA) {
        waitingReview.push(formatted);
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        inProgress.push(formatted);
      }

      // Date categorization (for non-completed)
      if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED) {
        if (task.dueDate) {
          const due = new Date(task.dueDate);
          if (due < startOfToday) {
            overdue.push(formatted);
          } else if (due >= startOfToday && due <= endOfToday) {
            today.push(formatted);
          } else {
            upcoming.push(formatted);
          }
        } else {
          upcoming.push(formatted);
        }
      }
    }

    return {
      metrics: {
        totalAssigned: tasks.length,
        overdueCount: overdue.length,
        todayCount: today.length,
        inProgressCount: inProgress.length,
        waitingReviewCount: waitingReview.length,
        completedCount: completed.length,
      },
      groups: {
        overdue,
        today,
        upcoming,
        inProgress,
        waitingReview,
        completed,
      },
      allTasks: tasks.map((t) => ({
        ...t,
        subtaskCount: t._count.subtasks,
        commentCount: t._count.comments,
        attachmentCount: t._count.attachments,
        _count: undefined,
      })),
    };
  }
}
