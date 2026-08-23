import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType } from '@prisma/client';

@Injectable()
export class CommentsService {
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

  async findAllByTask(taskId: string, user: AuthenticatedUser) {
    await this.verifyTaskAccess(taskId, user);

    return this.prisma.taskComment.findMany({
      where: { taskId, deletedAt: null },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, dto: CreateCommentDto, user: AuthenticatedUser) {
    const task = await this.verifyTaskAccess(taskId, user);

    // Extract user mentions if any
    let mentions = dto.mentions || [];
    if (mentions.length === 0) {
      // Find matches in task members
      const memberUserIds = task.project.members.map((m) => m.userId);
      const projectUsers = await this.prisma.user.findMany({
        where: { id: { in: memberUserIds } },
        select: { id: true, firstName: true, lastName: true },
      });

      for (const u of projectUsers) {
        const pattern = new RegExp(`@(${u.firstName}|${u.lastName}|${u.firstName}\\s+${u.lastName})`, 'i');
        if (pattern.test(dto.content)) {
          mentions.push(u.id);
        }
      }
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        userId: user.id,
        content: dto.content.trim(),
        mentions: Array.from(new Set(mentions)),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.COMMENT,
      entityId: comment.id,
      metadata: { taskId, taskNumber: task.taskNumber, mentions: comment.mentions },
    });

    return comment;
  }

  async update(id: string, dto: UpdateCommentDto, user: AuthenticatedUser) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: {
          include: { project: { include: { members: true } } },
        },
      },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    // Only comment author or elevated admin can edit
    if (comment.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only edit your own comments.');
    }

    const updated = await this.prisma.taskComment.update({
      where: { id },
      data: {
        content: dto.content.trim(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id },
      include: {
        task: {
          include: { project: { include: { members: true } } },
        },
      },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException(`Comment with ID "${id}" not found.`);
    }

    if (comment.userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only delete your own comments.');
    }

    await this.prisma.taskComment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.COMMENT,
      entityId: id,
      metadata: { taskId: comment.taskId },
    });

    return { success: true, message: 'Comment deleted.' };
  }
}
