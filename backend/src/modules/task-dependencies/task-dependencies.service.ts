import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType } from '@prisma/client';

@Injectable()
export class TaskDependenciesService {
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

  private async verifyTaskAccess(taskId: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: true },
        },
      },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException(`Task with ID "${taskId}" not found.`);
    }

    if (!this.isElevatedUser(user)) {
      const isMember = task.project.members.some((m) => m.userId === user.id);
      const isOwner = task.project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('You do not have access to this project.');
      }
    }

    return task;
  }

  /**
   * Checks whether adding a dependency where `fromTaskId` depends on `toTaskId`
   * creates a circular cycle. (i.e. if `toTaskId` already directly or transitively depends on `fromTaskId`).
   */
  private async wouldCreateCycle(fromTaskId: string, toTaskId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [toTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fromTaskId) {
        return true;
      }
      if (!visited.has(current)) {
        visited.add(current);
        const dependencies = await this.prisma.taskDependency.findMany({
          where: { taskId: current },
          select: { dependsOnTaskId: true },
        });
        for (const dep of dependencies) {
          if (!visited.has(dep.dependsOnTaskId)) {
            queue.push(dep.dependsOnTaskId);
          }
        }
      }
    }

    return false;
  }

  async addDependency(taskId: string, dto: CreateDependencyDto, user: AuthenticatedUser) {
    if (taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('A task cannot have a dependency on itself.');
    }

    const [task, dependsOnTask] = await Promise.all([
      this.verifyTaskAccess(taskId, user),
      this.verifyTaskAccess(dto.dependsOnTaskId, user),
    ]);

    if (task.projectId !== dependsOnTask.projectId) {
      throw new BadRequestException('Dependencies can only be created between tasks in the same project.');
    }

    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId: dto.dependsOnTaskId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('This dependency already exists.');
    }

    // Cycle detection
    const isCycle = await this.wouldCreateCycle(taskId, dto.dependsOnTaskId);
    if (isCycle) {
      throw new BadRequestException(
        `Circular dependency detected: Task #${dependsOnTask.taskNumber} already depends on Task #${task.taskNumber}.`,
      );
    }

    const dependency = await this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
        dependencyType: dto.dependencyType,
      },
      include: {
        dependsOnTask: { select: { id: true, taskNumber: true, title: true, status: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TASK,
      entityId: taskId,
      metadata: {
        action: 'ADD_DEPENDENCY',
        dependsOnTaskId: dto.dependsOnTaskId,
        type: dto.dependencyType,
      },
    });

    return dependency;
  }

  async removeDependency(taskId: string, dependsOnTaskId: string, user: AuthenticatedUser) {
    await this.verifyTaskAccess(taskId, user);

    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Dependency record not found.');
    }

    await this.prisma.taskDependency.delete({
      where: { id: existing.id },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.TASK,
      entityId: taskId,
      metadata: {
        action: 'REMOVE_DEPENDENCY',
        dependsOnTaskId,
      },
    });

    return { success: true, message: 'Dependency removed.' };
  }
}
