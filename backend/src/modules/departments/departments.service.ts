import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateDepartmentDto, DepartmentQueryDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, GeneralStatus, Prisma } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll(query: DepartmentQueryDto) {
    const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, departments] = await Promise.all([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              users: { where: { deletedAt: null } },
              teams: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const formatted = departments.map((d) => ({
      ...d,
      userCount: d._count.users,
      teamCount: d._count.teams,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            status: true,
          },
        },
        teams: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            teamLead: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!department || department.deletedAt) {
      throw new NotFoundException(`Department with ID "${id}" not found.`);
    }

    return department;
  }

  async create(dto: CreateDepartmentDto, actorId?: string) {
    const existing = await this.prisma.department.findUnique({
      where: { name: dto.name.trim() },
    });

    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`Department with name "${dto.name}" already exists.`);
    }

    const department = await this.prisma.department.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        status: dto.status || GeneralStatus.ACTIVE,
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.DEPARTMENT,
      entityId: department.id,
      metadata: { name: department.name },
    });

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, actorId?: string) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.department.findUnique({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new BadRequestException(`Department with name "${dto.name}" already exists.`);
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        status: dto.status,
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.DEPARTMENT,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const dept = await this.findOne(id);

    // Check if users exist in this department
    const userCount = await this.prisma.user.count({
      where: { departmentId: id, deletedAt: null },
    });

    if (userCount > 0) {
      // Soft-archive rather than breaking relationships
      await this.prisma.department.update({
        where: { id },
        data: {
          status: GeneralStatus.ARCHIVED,
          deletedAt: new Date(),
        },
      });
    } else {
      await this.prisma.department.update({
        where: { id },
        data: {
          status: GeneralStatus.ARCHIVED,
          deletedAt: new Date(),
        },
      });
    }

    await this.activityLogs.log({
      actorId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.DEPARTMENT,
      entityId: id,
      metadata: { name: dept.name },
    });

    return { success: true, message: 'Department archived successfully.' };
  }
}
