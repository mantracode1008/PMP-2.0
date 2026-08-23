import { Injectable, Logger } from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogQueryDto } from './dto/log-query.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

export interface CreateLogParams {
  actorId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateLogParams) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write activity log: ${error.message}`, error.stack);
      // Non-blocking for primary operations
      return null;
    }
  }

  async findAll(query: ActivityLogQueryDto) {
    const { page = 1, limit = 10, action, entityType, actorId, entityId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    if (entityId) where.entityId = entityId;

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { actor: { email: { contains: search, mode: 'insensitive' } } },
        { actor: { firstName: { contains: search, mode: 'insensitive' } } },
        { actor: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return createPaginatedResult(logs, total, page, limit);
  }
}
