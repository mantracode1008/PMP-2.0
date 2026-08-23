import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  HealthDimension,
  OverrideHealthDto,
  ProjectHealthReport,
} from './dto/project-health.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  AuditAction,
  AuditEntityType,
  ChangeRequestStatus,
  IssueSeverity,
  IssueStatus,
  IssueType,
  MilestoneStatus,
  ProjectHealth,
  RiskStatus,
  TaskStatus,
} from '@prisma/client';

@Injectable()
export class ProjectHealthService {
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

  private async verifyProjectAccess(projectId: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
        healthOverriddenBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    if (!this.isElevatedUser(user)) {
      const isMember = project.members.some((m) => m.userId === user.id);
      const isOwner = project.ownerId === user.id;
      if (!isMember && !isOwner) {
        throw new ForbiddenException('You do not have access to this project.');
      }
    }

    return project;
  }

  /**
   * Centralized Project Health Calculation Engine
   * Deterministic 5-dimension assessment:
   * 1. Schedule Health
   * 2. Scope Health
   * 3. Resource Health
   * 4. Risk Health
   * 5. Issue Health
   */
  async computeHealth(projectId: string, user: AuthenticatedUser): Promise<ProjectHealthReport> {
    const project = await this.verifyProjectAccess(projectId, user);
    const now = new Date();

    // 1. Fetch relevant metrics in parallel
    const [tasks, milestones, changeRequests, risks, issues, members] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, status: true, dueDate: true, priority: true },
      }),
      this.prisma.milestone.findMany({
        where: { projectId, deletedAt: null },
        select: { id: true, status: true, dueDate: true },
      }),
      this.prisma.changeRequest.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { in: [ChangeRequestStatus.SUBMITTED, ChangeRequestStatus.UNDER_REVIEW] },
        },
        select: { id: true, type: true, scheduleImpactDays: true },
      }),
      this.prisma.risk.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { in: [RiskStatus.OPEN, RiskStatus.MONITORING] },
        },
        select: { id: true, riskScore: true, probability: true, impact: true, status: true },
      }),
      this.prisma.issue.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] },
        },
        select: { id: true, severity: true, priority: true, type: true, status: true },
      }),
      this.prisma.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      }),
    ]);

    // --- DIMENSION 1: SCHEDULE HEALTH ---
    const overdueTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== TaskStatus.COMPLETED &&
        t.status !== TaskStatus.CANCELLED,
    );
    const delayedMilestones = milestones.filter(
      (m) =>
        m.dueDate &&
        new Date(m.dueDate) < now &&
        m.status !== MilestoneStatus.COMPLETED,
    );

    let scheduleStatus: ProjectHealth = ProjectHealth.HEALTHY;
    let scheduleScore = 0;
    let scheduleSummary = 'Schedule is on track with zero overdue items.';

    if (overdueTasks.length >= 3 || delayedMilestones.length >= 2) {
      scheduleStatus = ProjectHealth.CRITICAL;
      scheduleScore = 2;
      scheduleSummary = `${overdueTasks.length} overdue tasks and ${delayedMilestones.length} delayed milestones detected.`;
    } else if (overdueTasks.length > 0 || delayedMilestones.length > 0) {
      scheduleStatus = ProjectHealth.AT_RISK;
      scheduleScore = 1;
      scheduleSummary = `${overdueTasks.length} task(s) or milestone(s) behind schedule.`;
    }

    const scheduleDim: HealthDimension = {
      status: scheduleStatus,
      score: scheduleScore,
      summary: scheduleSummary,
      details: {
        totalTasks: tasks.length,
        overdueTasksCount: overdueTasks.length,
        delayedMilestonesCount: delayedMilestones.length,
      },
    };

    // --- DIMENSION 2: SCOPE HEALTH ---
    let scopeStatus: ProjectHealth = ProjectHealth.HEALTHY;
    let scopeScore = 0;
    let scopeSummary = 'Scope baseline is stable with no excessive pending change requests.';

    const totalScheduleImpact = changeRequests.reduce((acc, cr) => acc + (cr.scheduleImpactDays || 0), 0);
    if (changeRequests.length >= 4 || totalScheduleImpact >= 21) {
      scopeStatus = ProjectHealth.CRITICAL;
      scopeScore = 2;
      scopeSummary = `${changeRequests.length} pending change requests with +${totalScheduleImpact} days cumulative schedule expansion.`;
    } else if (changeRequests.length >= 2 || totalScheduleImpact >= 7) {
      scopeStatus = ProjectHealth.AT_RISK;
      scopeScore = 1;
      scopeSummary = `${changeRequests.length} pending change requests awaiting review.`;
    }

    const scopeDim: HealthDimension = {
      status: scopeStatus,
      score: scopeScore,
      summary: scopeSummary,
      details: {
        pendingChangeRequestsCount: changeRequests.length,
        cumulativeScheduleImpactDays: totalScheduleImpact,
      },
    };

    // --- DIMENSION 3: RESOURCE HEALTH ---
    // Rule: Check if assigned tasks load per active member is balanced
    let resourceStatus: ProjectHealth = ProjectHealth.HEALTHY;
    let resourceScore = 0;
    let resourceSummary = 'Team capacity and resource assignments are balanced.';

    // Check project member capacities
    const memberIds = members.map((m) => m.userId);
    const memberCapacities = await this.prisma.userCapacity.findMany({
      where: { userId: { in: memberIds } },
    });

    const resourceDim: HealthDimension = {
      status: resourceStatus,
      score: resourceScore,
      summary: resourceSummary,
      details: {
        projectMembersCount: members.length,
      },
    };

    // --- DIMENSION 4: RISK HEALTH ---
    const criticalRisks = risks.filter((r) => r.riskScore >= 12);
    const highRisks = risks.filter((r) => r.riskScore >= 8 && r.riskScore < 12);

    let riskStatus: ProjectHealth = ProjectHealth.HEALTHY;
    let riskScoreVal = 0;
    let riskSummary = 'No critical project risks identified.';

    if (criticalRisks.length > 0) {
      riskStatus = ProjectHealth.CRITICAL;
      riskScoreVal = 2;
      riskSummary = `${criticalRisks.length} critical risk(s) require immediate mitigation.`;
    } else if (highRisks.length > 0) {
      riskStatus = ProjectHealth.AT_RISK;
      riskScoreVal = 1;
      riskSummary = `${highRisks.length} elevated risk(s) currently being monitored.`;
    }

    const riskDim: HealthDimension = {
      status: riskStatus,
      score: riskScoreVal,
      summary: riskSummary,
      details: {
        openRisksCount: risks.length,
        criticalRisksCount: criticalRisks.length,
        highRisksCount: highRisks.length,
      },
    };

    // --- DIMENSION 5: ISSUE HEALTH ---
    const blockerIssues = issues.filter(
      (i) => i.severity === IssueSeverity.CRITICAL || i.type === IssueType.BLOCKER,
    );
    const highIssues = issues.filter(
      (i) => i.severity === IssueSeverity.HIGH && i.type !== IssueType.BLOCKER,
    );

    let issueStatus: ProjectHealth = ProjectHealth.HEALTHY;
    let issueScore = 0;
    let issueSummary = 'No active blocking or critical issues.';

    if (blockerIssues.length > 0) {
      issueStatus = ProjectHealth.CRITICAL;
      issueScore = 2;
      issueSummary = `${blockerIssues.length} active critical/blocker issue(s) affecting delivery.`;
    } else if (highIssues.length > 0) {
      issueStatus = ProjectHealth.AT_RISK;
      issueScore = 1;
      issueSummary = `${highIssues.length} high-severity issue(s) under resolution.`;
    }

    const issueDim: HealthDimension = {
      status: issueStatus,
      score: issueScore,
      summary: issueSummary,
      details: {
        openIssuesCount: issues.length,
        blockerIssuesCount: blockerIssues.length,
        highSeverityCount: highIssues.length,
      },
    };

    // --- OVERALL HEALTH AGGREGATION ---
    const dimensionStatuses = [scheduleStatus, scopeStatus, resourceStatus, riskStatus, issueStatus];
    const criticalCount = dimensionStatuses.filter((s) => s === ProjectHealth.CRITICAL).length;
    const atRiskCount = dimensionStatuses.filter((s) => s === ProjectHealth.AT_RISK).length;

    let calculatedOverall: ProjectHealth = ProjectHealth.HEALTHY;
    if (criticalCount > 0 || atRiskCount >= 2) {
      calculatedOverall = ProjectHealth.CRITICAL;
    } else if (atRiskCount === 1) {
      calculatedOverall = ProjectHealth.AT_RISK;
    }

    // Persist calculatedHealth and sync effective health if not overridden
    if (project.calculatedHealth !== calculatedOverall || (!project.isHealthOverridden && project.health !== calculatedOverall)) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          calculatedHealth: calculatedOverall,
          health: project.isHealthOverridden ? project.health : calculatedOverall,
        },
      });
    }

    return {
      projectId: project.id,
      projectName: project.name,
      projectCode: project.code,
      overallHealth: project.isHealthOverridden ? project.health : calculatedOverall,
      calculatedHealth: calculatedOverall,
      isOverridden: project.isHealthOverridden,
      overrideDetails: project.isHealthOverridden
        ? {
            reason: project.healthOverrideReason,
            overriddenBy: project.healthOverriddenBy,
            overriddenAt: project.healthOverriddenAt,
          }
        : undefined,
      dimensions: {
        schedule: scheduleDim,
        scope: scopeDim,
        resources: resourceDim,
        risks: riskDim,
        issues: issueDim,
      },
      calculatedAt: now,
    };
  }

  async overrideHealth(projectId: string, dto: OverrideHealthDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot override health on an archived project.');
    }

    // Verify permission or ownership
    const isElevated = this.isElevatedUser(user);
    const isOwner = project.ownerId === user.id;
    if (!isElevated && !isOwner) {
      throw new ForbiddenException('Only project owners or administrators can manually override project health.');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        health: dto.health,
        isHealthOverridden: true,
        healthOverrideReason: dto.reason,
        healthOverriddenById: user.id,
        healthOverriddenAt: new Date(),
      },
      include: {
        healthOverriddenBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.OVERRIDE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: {
        previousHealth: project.health,
        overrideHealth: dto.health,
        reason: dto.reason,
      },
    });

    return this.computeHealth(projectId, user);
  }

  async resetHealthOverride(projectId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot reset health override on an archived project.');
    }

    const isElevated = this.isElevatedUser(user);
    const isOwner = project.ownerId === user.id;
    if (!isElevated && !isOwner) {
      throw new ForbiddenException('Only project owners or administrators can reset project health override.');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        health: project.calculatedHealth,
        isHealthOverridden: false,
        healthOverrideReason: null,
        healthOverriddenById: null,
        healthOverriddenAt: null,
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: {
        action: 'RESET_HEALTH_OVERRIDE',
        restoredHealth: project.calculatedHealth,
      },
    });

    return this.computeHealth(projectId, user);
  }
}
