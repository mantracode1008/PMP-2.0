import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './dto/create-user.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, Prisma, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, search, status, departmentId, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    if (role) {
      where.userRoles = {
        some: {
          OR: [{ role: { name: role } }, { roleId: role }],
        },
      };
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          phone: true,
          status: true,
          departmentId: true,
          department: {
            select: { id: true, name: true },
          },
          userRoles: {
            select: {
              role: {
                select: { id: true, name: true, displayName: true },
              },
            },
          },
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const formatted = users.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role),
      userRoles: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        teamMemberships: {
          include: {
            team: true,
          },
        },
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID "${id}" not found.`);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    if (roles.includes('SUPER_ADMIN')) {
      permissionSet.add('*');
    }
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      department: user.department,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name, displayName: ur.role.displayName })),
      permissions: Array.from(permissionSet),
      teams: user.teamMemberships.map((tm) => ({ id: tm.team.id, name: tm.team.name, role: tm.role })),
      projects: user.projectMembers.map((pm) => ({ id: pm.project.id, name: pm.project.name, code: pm.project.code, role: pm.projectRole })),
    };
  }

  async create(dto: CreateUserDto, actorId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`User with email "${dto.email}" already exists.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Resolve roles
    const roleNamesOrIds = dto.roles && dto.roles.length > 0 ? dto.roles : ['USER'];
    const matchedRoles = await this.prisma.role.findMany({
      where: {
        OR: [
          { name: { in: roleNamesOrIds } },
          { id: { in: roleNamesOrIds } },
        ],
      },
    });

    if (matchedRoles.length === 0) {
      const defaultRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
      if (defaultRole) matchedRoles.push(defaultRole);
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        departmentId: dto.departmentId || null,
        status: dto.status || UserStatus.ACTIVE,
        userRoles: {
          create: matchedRoles.map((r) => ({
            roleId: r.id,
          })),
        },
      },
      include: {
        department: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      metadata: { email: user.email, name: `${user.firstName} ${user.lastName}` },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      status: user.status,
      department: user.department,
      roles: user.userRoles.map((ur) => ur.role),
      createdAt: user.createdAt,
    };
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
    await this.findOne(id);

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.departmentId !== undefined) {
      updateData.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    }

    // Role assignment if provided
    if (dto.roles !== undefined) {
      const matchedRoles = await this.prisma.role.findMany({
        where: {
          OR: [
            { name: { in: dto.roles } },
            { id: { in: dto.roles } },
          ],
        },
      });

      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (matchedRoles.length > 0) {
        await this.prisma.userRole.createMany({
          data: matchedRoles.map((r) => ({ userId: id, roleId: r.id })),
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.USER,
      entityId: id,
      metadata: { changes: dto },
    });

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      avatarUrl: updated.avatarUrl,
      phone: updated.phone,
      status: updated.status,
      department: updated.department,
      roles: updated.userRoles.map((ur) => ur.role),
      updatedAt: updated.updatedAt,
    };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actorId?: string) {
    const user = await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    // If deactivating or suspending, revoke active refresh tokens
    if (dto.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    }

    await this.activityLogs.log({
      actorId,
      action: AuditAction.STATUS_CHANGE,
      entityType: AuditEntityType.USER,
      entityId: id,
      metadata: { previousStatus: user.status, newStatus: dto.status },
    });

    return { id: updated.id, status: updated.status };
  }

  async remove(id: string, actorId?: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: UserStatus.ARCHIVED,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: id },
      data: { isRevoked: true },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.USER,
      entityId: id,
      metadata: { softDelete: true },
    });

    return { success: true, message: 'User archived successfully.' };
  }

  async getMetrics() {
    const [totalUsers, activeUsers, totalAdmins] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, deletedAt: null } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          userRoles: {
            some: {
              role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
            },
          },
        },
      }),
    ]);

    return { totalUsers, activeUsers, totalAdmins };
  }
}
