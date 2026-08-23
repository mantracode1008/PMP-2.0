import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UpdateCapacityDto, WorkloadQueryDto } from './dto/workload.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, Prisma, TaskStatus, UserStatus } from '@prisma/client';

export type WorkloadStatus = 'AVAILABLE' | 'HEALTHY' | 'NEAR_CAPACITY' | 'OVERLOADED';

@Injectable()
export class WorkloadService {
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

  async getUserCapacity(userId: string, user: AuthenticatedUser) {
    if (userId !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You do not have access to view another user capacity.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    let capacity = await this.prisma.userCapacity.findUnique({
      where: { userId },
    });

    if (!capacity) {
      capacity = await this.prisma.userCapacity.create({
        data: {
          userId,
          dailyCapacityMinutes: 480,
          weeklyCapacityMinutes: 2400,
          workingDays: [1, 2, 3, 4, 5],
        },
      });
    }

    return {
      ...capacity,
      dailyCapacityHours: Number((capacity.dailyCapacityMinutes / 60).toFixed(1)),
      weeklyCapacityHours: Number((capacity.weeklyCapacityMinutes / 60).toFixed(1)),
      user: targetUser,
    };
  }

  async updateUserCapacity(userId: string, dto: UpdateCapacityDto, user: AuthenticatedUser) {
    if (!this.isElevatedUser(user)) {
      throw new ForbiddenException('Only administrators can configure working schedules and user capacity.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User not found.');
    }

    if (dto.dailyCapacityMinutes && dto.dailyCapacityMinutes <= 0) {
      throw new BadRequestException('Daily capacity must be greater than zero.');
    }

    if (dto.weeklyCapacityMinutes && dto.weeklyCapacityMinutes <= 0) {
      throw new BadRequestException('Weekly capacity must be greater than zero.');
    }

    const updated = await this.prisma.userCapacity.upsert({
      where: { userId },
      update: {
        dailyCapacityMinutes: dto.dailyCapacityMinutes,
        weeklyCapacityMinutes: dto.weeklyCapacityMinutes,
        workingDays: dto.workingDays,
      },
      create: {
        userId,
        dailyCapacityMinutes: dto.dailyCapacityMinutes || 480,
        weeklyCapacityMinutes: dto.weeklyCapacityMinutes || 2400,
        workingDays: dto.workingDays || [1, 2, 3, 4, 5],
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CAPACITY,
      entityId: userId,
      metadata: { changes: dto },
    });

    return {
      ...updated,
      dailyCapacityHours: Number((updated.dailyCapacityMinutes / 60).toFixed(1)),
      weeklyCapacityHours: Number((updated.weeklyCapacityMinutes / 60).toFixed(1)),
    };
  }

  async getTeamWorkload(query: WorkloadQueryDto, user: AuthenticatedUser) {
    const { projectId, teamId, departmentId, search, startDate, endDate } = query;

    const userWhere: Prisma.UserWhereInput = {
      status: UserStatus.ACTIVE,
      deletedAt: null,
    };

    if (departmentId) {
      userWhere.departmentId = departmentId;
    }

    if (teamId) {
      userWhere.teamMemberships = {
        some: { teamId },
      };
    }

    if (projectId) {
      userWhere.projectMembers = {
        some: { projectId },
      };
    }

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (!this.isElevatedUser(user)) {
      // Non-admins can only see users from their own shared projects or teams
      const myProjects = await this.prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      const projectIds = myProjects.map((p) => p.projectId);

      userWhere.projectMembers = {
        some: { projectId: { in: projectIds } },
      };
    }

    const users = await this.prisma.user.findMany({
      where: userWhere,
      include: {
        department: { select: { id: true, name: true } },
        teamMemberships: {
          include: { team: { select: { id: true, name: true } } },
        },
        capacity: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    // Determine date range for actual logged time calculation
    let dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
    } else {
      // Default to current week
      const day = now.getUTCDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diffToMonday, 0, 0, 0, 0));
      const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 23, 59, 59, 999));
      dateFilter = { gte: monday, lte: sunday };
    }

    const userWorkloadList = [];
    let totalOrgCapacityMinutes = 0;
    let totalOrgAssignedMinutes = 0;
    let totalOrgLoggedMinutes = 0;
    let overloadedCount = 0;
    let healthyCount = 0;
    let availableCount = 0;
    let nearCapacityCount = 0;

    for (const u of users) {
      const weeklyCapacityMinutes = u.capacity?.weeklyCapacityMinutes || 2400; // 40h default
      const weeklyCapacityHours = Number((weeklyCapacityMinutes / 60).toFixed(1));

      // Open assigned tasks
      const assignedTasks = await this.prisma.task.findMany({
        where: {
          assignees: { some: { userId: u.id } },
          status: {
            notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
          },
          deletedAt: null,
          ...(projectId ? { projectId } : {}),
        },
        select: {
          id: true,
          estimatedHours: true,
          dueDate: true,
          status: true,
          progress: true,
        },
      });

      let assignedEstimatedHours = 0;
      let overdueTasksCount = 0;

      for (const t of assignedTasks) {
        // Remaining effort estimate = estimatedHours * (1 - progress/100) or full estimate
        const remainingEffort = (t.estimatedHours || 8) * (1 - (t.progress || 0) / 100);
        assignedEstimatedHours += remainingEffort;

        if (t.dueDate && new Date(t.dueDate) < startOfToday) {
          overdueTasksCount += 1;
        }
      }

      assignedEstimatedHours = Number(assignedEstimatedHours.toFixed(1));
      const assignedEstimatedMinutes = Math.round(assignedEstimatedHours * 60);

      // Logged work in period
      const workLogAgg = await this.prisma.workLog.aggregate({
        where: {
          userId: u.id,
          date: dateFilter,
          deletedAt: null,
          ...(projectId ? { projectId } : {}),
        },
        _sum: { durationMinutes: true },
      });

      const actualLoggedMinutes = workLogAgg._sum.durationMinutes || 0;
      const actualLoggedHours = Number((actualLoggedMinutes / 60).toFixed(1));

      // Utilization based on assigned work vs weekly capacity
      const utilization = weeklyCapacityHours > 0
        ? Math.round((assignedEstimatedHours / weeklyCapacityHours) * 100)
        : 0;

      let status: WorkloadStatus = 'HEALTHY';
      if (utilization < 50) {
        status = 'AVAILABLE';
        availableCount += 1;
      } else if (utilization <= 100) {
        status = 'HEALTHY';
        healthyCount += 1;
      } else if (utilization <= 120) {
        status = 'NEAR_CAPACITY';
        nearCapacityCount += 1;
      } else {
        status = 'OVERLOADED';
        overloadedCount += 1;
      }

      totalOrgCapacityMinutes += weeklyCapacityMinutes;
      totalOrgAssignedMinutes += assignedEstimatedMinutes;
      totalOrgLoggedMinutes += actualLoggedMinutes;

      userWorkloadList.push({
        user: {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          department: u.department,
          teams: u.teamMemberships.map((tm) => tm.team),
        },
        capacity: {
          dailyCapacityMinutes: u.capacity?.dailyCapacityMinutes || 480,
          dailyCapacityHours: Number(((u.capacity?.dailyCapacityMinutes || 480) / 60).toFixed(1)),
          weeklyCapacityMinutes,
          weeklyCapacityHours,
          workingDays: u.capacity?.workingDays || [1, 2, 3, 4, 5],
        },
        assignedEstimatedHours,
        actualLoggedMinutes,
        actualLoggedHours,
        openTasksCount: assignedTasks.length,
        overdueTasksCount,
        utilization,
        status,
      });
    }

    const totalCapacityHours = Number((totalOrgCapacityMinutes / 60).toFixed(1));
    const totalAssignedHours = Number((totalOrgAssignedMinutes / 60).toFixed(1));
    const totalLoggedHours = Number((totalOrgLoggedMinutes / 60).toFixed(1));
    const averageUtilization = totalCapacityHours > 0
      ? Math.round((totalAssignedHours / totalCapacityHours) * 100)
      : 0;

    return {
      summary: {
        totalUsers: users.length,
        totalCapacityHours,
        totalAssignedHours,
        totalLoggedHours,
        averageUtilization,
        overloadedCount,
        nearCapacityCount,
        healthyCount,
        availableCount,
      },
      users: userWorkloadList,
    };
  }
}
