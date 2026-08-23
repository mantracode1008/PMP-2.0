import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/create-role.dto';
import { AuditAction, AuditEntityType } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    return role;
  }

  async create(dto: CreateRoleDto, actorId?: string) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name.toUpperCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`Role with name "${dto.name}" already exists.`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name.toUpperCase().trim(),
        displayName: dto.displayName,
        description: dto.description,
        isSystem: false,
        rolePermissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((pId) => ({
                permissionId: pId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.ROLE,
      entityId: role.id,
      metadata: { roleName: role.name },
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, actorId?: string) {
    const role = await this.findOne(id);

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.ROLE,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async updatePermissions(id: string, dto: AssignPermissionsDto, actorId?: string) {
    const role = await this.findOne(id);

    // Atomically replace permissions
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((pId) => ({
          roleId: id,
          permissionId: pId,
        })),
      }),
    ]);

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.ROLE,
      entityId: id,
      metadata: { action: 'ASSIGN_PERMISSIONS', count: dto.permissionIds.length },
    });

    return this.findOne(id);
  }
}
