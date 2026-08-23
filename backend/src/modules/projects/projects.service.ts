import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from './dto/create-project.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  AuditAction,
  AuditEntityType,
  Prisma,
  ProjectHealth,
  ProjectMemberRole,
  ProjectStatus,
} from '@prisma/client';

@Injectable()
export class ProjectsService {
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

  async findAll(query: ProjectQueryDto, user: AuthenticatedUser) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      health,
      clientId,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    // Scoping for non-admins
    if (!this.isElevatedUser(user)) {
      where.OR = [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ];
    }

    if (status) where.status = status;
    if (health) where.health = health;
    if (clientId) where.clientId = clientId;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      const searchCondition = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        where.AND = [{ OR: searchCondition }];
      } else {
        where.OR = searchCondition;
      }
    }

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          client: { select: { id: true, name: true, companyName: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      memberCount: p._count.members,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, department: { select: { name: true } } },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                status: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${id}" not found.`);
    }

    // Role-based access check
    if (!this.isElevatedUser(user)) {
      const isMember = project.members.some((m) => m.userId === user.id);
      const isOwner = project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('You do not have access to this project.');
      }
    }

    return {
      ...project,
      members: project.members.map((m) => ({
        id: m.id,
        projectRole: m.projectRole,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    };
  }

  async create(dto: CreateProjectDto, user: AuthenticatedUser) {
    if (dto.startDate && dto.targetDate && new Date(dto.startDate) > new Date(dto.targetDate)) {
      throw new BadRequestException('Project start date cannot be later than the target completion date.');
    }

    // Generate project code if not provided
    let code = dto.code?.toUpperCase().trim();
    if (!code) {
      const count = await this.prisma.project.count();
      code = `PRJ-${String(count + 1).padStart(3, '0')}`;
    }

    const existingCode = await this.prisma.project.findUnique({ where: { code } });
    if (existingCode && !existingCode.deletedAt) {
      throw new BadRequestException(`Project with code "${code}" already exists.`);
    }

    const ownerId = dto.ownerId || user.id;

    // Verify client exists
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || client.deletedAt) {
      throw new BadRequestException(`Client with ID "${dto.clientId}" not found.`);
    }

    // Initial member IDs: ensure owner is included
    const memberIdSet = new Set<string>(dto.memberIds || []);
    memberIdSet.add(ownerId);

    const project = await this.prisma.project.create({
      data: {
        code,
        name: dto.name.trim(),
        description: dto.description,
        status: dto.status || ProjectStatus.PLANNING,
        health: dto.health || ProjectHealth.HEALTHY,
        clientId: dto.clientId,
        ownerId,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        members: {
          create: Array.from(memberIdSet).map((mUserId) => ({
            userId: mUserId,
            projectRole: mUserId === ownerId ? ProjectMemberRole.MANAGER : ProjectMemberRole.MEMBER,
          })),
        },
      },
      include: {
        client: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PROJECT,
      entityId: project.id,
      metadata: { code: project.code, name: project.name },
    });

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, user: AuthenticatedUser) {
    const project = await this.findOne(id, user);

    const effectiveStartDate = dto.startDate ? new Date(dto.startDate) : project.startDate;
    const effectiveTargetDate = dto.targetDate ? new Date(dto.targetDate) : project.targetDate;
    if (effectiveStartDate && effectiveTargetDate && effectiveStartDate > effectiveTargetDate) {
      throw new BadRequestException('Project start date cannot be later than the target completion date.');
    }

    const updateData: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.health !== undefined) updateData.health = dto.health;
    if (dto.clientId !== undefined) {
      updateData.client = { connect: { id: dto.clientId } };
    }
    if (dto.ownerId !== undefined) {
      updateData.owner = { connect: { id: dto.ownerId } };
    }
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.targetDate !== undefined) {
      updateData.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    }
    if (dto.actualEndDate !== undefined) {
      updateData.actualEndDate = dto.actualEndDate ? new Date(dto.actualEndDate) : null;
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async addMember(projectId: string, dto: AddProjectMemberDto, user: AuthenticatedUser) {
    await this.findOne(projectId, user);

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already assigned to this project.');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        projectRole: dto.projectRole || ProjectMemberRole.MEMBER,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: { action: 'ADD_MEMBER', userId: dto.userId, role: dto.projectRole },
    });

    return member;
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    dto: UpdateProjectMemberDto,
    user: AuthenticatedUser,
  ) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Project member not found.');
    }

    const updated = await this.prisma.projectMember.update({
      where: { id: member.id },
      data: { projectRole: dto.projectRole },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: { action: 'UPDATE_MEMBER_ROLE', userId, role: dto.projectRole },
    });

    return updated;
  }

  async removeMember(projectId: string, userId: string, user: AuthenticatedUser) {
    const project = await this.findOne(projectId, user);

    if (project.ownerId === userId) {
      throw new BadRequestException('Cannot remove the project owner from project members.');
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Project member not found.');
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: { action: 'REMOVE_MEMBER', userId },
    });

    return { success: true, message: 'Member removed from project.' };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const project = await this.findOne(id, user);

    await this.prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.PROJECT,
      entityId: id,
      metadata: { name: project.name, code: project.code },
    });

    return { success: true, message: 'Project archived successfully.' };
  }

  async getMetrics(user: AuthenticatedUser) {
    const where: Prisma.ProjectWhereInput = { deletedAt: null };

    if (!this.isElevatedUser(user)) {
      where.OR = [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ];
    }

    const [totalProjects, activeProjects, planningProjects, healthyCount, atRiskCount, criticalCount] =
      await Promise.all([
        this.prisma.project.count({ where }),
        this.prisma.project.count({ where: { ...where, status: ProjectStatus.ACTIVE } }),
        this.prisma.project.count({ where: { ...where, status: ProjectStatus.PLANNING } }),
        this.prisma.project.count({ where: { ...where, health: ProjectHealth.HEALTHY } }),
        this.prisma.project.count({ where: { ...where, health: ProjectHealth.AT_RISK } }),
        this.prisma.project.count({ where: { ...where, health: ProjectHealth.CRITICAL } }),
      ]);

    return {
      totalProjects,
      activeProjects,
      planningProjects,
      health: {
        healthy: healthyCount,
        atRisk: atRiskCount,
        critical: criticalCount,
      },
    };
  }
}
