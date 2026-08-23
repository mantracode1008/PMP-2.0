import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  TeamQueryDto,
  UpdateTeamDto,
  UpdateTeamMemberDto,
} from './dto/create-team.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, GeneralStatus, Prisma, TeamMemberRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll(query: TeamQueryDto) {
    const { page = 1, limit = 10, search, status, departmentId, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, teams] = await Promise.all([
      this.prisma.team.count({ where }),
      this.prisma.team.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          department: { select: { id: true, name: true } },
          teamLead: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
    ]);

    const formatted = teams.map((t) => ({
      ...t,
      memberCount: t._count.members,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        department: true,
        teamLead: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
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

    if (!team || team.deletedAt) {
      throw new NotFoundException(`Team with ID "${id}" not found.`);
    }

    return {
      ...team,
      members: team.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    };
  }

  async create(dto: CreateTeamDto, actorId?: string) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        departmentId: dto.departmentId || null,
        teamLeadId: dto.teamLeadId || null,
        status: dto.status || GeneralStatus.ACTIVE,
        members: dto.memberIds?.length
          ? {
              create: dto.memberIds.map((userId) => ({
                userId,
                role: userId === dto.teamLeadId ? TeamMemberRole.LEAD : TeamMemberRole.MEMBER,
              })),
            }
          : undefined,
      },
      include: {
        department: true,
        teamLead: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.TEAM,
      entityId: team.id,
      metadata: { name: team.name },
    });

    return team;
  }

  async update(id: string, dto: UpdateTeamDto, actorId?: string) {
    await this.findOne(id);

    const updateData: Prisma.TeamUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.departmentId !== undefined) {
      updateData.department = dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true };
    }
    if (dto.teamLeadId !== undefined) {
      updateData.teamLead = dto.teamLeadId ? { connect: { id: dto.teamLeadId } } : { disconnect: true };
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        teamLead: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TEAM,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async addMember(teamId: string, dto: AddTeamMemberDto, actorId?: string) {
    await this.findOne(teamId);

    const existing = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this team.');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: dto.userId,
        role: dto.role || TeamMemberRole.MEMBER,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TEAM,
      entityId: teamId,
      metadata: { action: 'ADD_MEMBER', memberId: dto.userId },
    });

    return member;
  }

  async updateMember(teamId: string, userId: string, dto: UpdateTeamMemberDto, actorId?: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Team member record not found.');
    }

    const updated = await this.prisma.teamMember.update({
      where: { id: member.id },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TEAM,
      entityId: teamId,
      metadata: { action: 'UPDATE_MEMBER_ROLE', userId, role: dto.role },
    });

    return updated;
  }

  async removeMember(teamId: string, userId: string, actorId?: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Team member record not found.');
    }

    await this.prisma.teamMember.delete({
      where: { id: member.id },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.TEAM,
      entityId: teamId,
      metadata: { action: 'REMOVE_MEMBER', userId },
    });

    return { success: true, message: 'Member removed from team.' };
  }

  async remove(id: string, actorId?: string) {
    const team = await this.findOne(id);

    await this.prisma.team.update({
      where: { id },
      data: {
        status: GeneralStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.TEAM,
      entityId: id,
      metadata: { name: team.name },
    });

    return { success: true, message: 'Team archived successfully.' };
  }
}
