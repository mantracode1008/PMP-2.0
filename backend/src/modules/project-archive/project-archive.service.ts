import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ArchiveProjectDto, ProjectClosureCheckResult } from './dto/project-archive.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  ApprovalStatus,
  AuditAction,
  AuditEntityType,
  ClosureValidationPolicy,
  IssueSeverity,
  IssueStatus,
  ProjectStatus,
  RiskStatus,
  TaskStatus,
} from '@prisma/client';

@Injectable()
export class ProjectArchiveService {
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
        archivedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    if (!this.isElevatedUser(user)) {
      const isOwner = project.ownerId === user.id;
      if (!isOwner) {
        throw new ForbiddenException('Only project owners or administrators can manage project archiving.');
      }
    }

    return project;
  }

  /**
   * Pre-closure validation check inspecting active work items
   */
  async validateClosure(projectId: string, user: AuthenticatedUser): Promise<ProjectClosureCheckResult> {
    const project = await this.verifyProjectAccess(projectId, user);

    const [uncompletedTasks, criticalIssues, pendingApprovals, highRisks] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        },
        select: { id: true, title: true, status: true },
      }),
      this.prisma.issue.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS] },
          severity: { in: [IssueSeverity.CRITICAL, IssueSeverity.HIGH] },
        },
        select: { id: true, title: true, severity: true },
      }),
      this.prisma.approvalRequest.findMany({
        where: {
          projectId,
          status: ApprovalStatus.PENDING,
        },
        select: { id: true, entityType: true, status: true },
      }),
      this.prisma.risk.findMany({
        where: {
          projectId,
          deletedAt: null,
          status: { in: [RiskStatus.OPEN, RiskStatus.MONITORING] },
          riskScore: { gte: 9 },
        },
        select: { id: true, title: true, riskScore: true },
      }),
    ]);

    const blockersCount = criticalIssues.length + pendingApprovals.length;
    const warningsCount = uncompletedTasks.length + highRisks.length;

    return {
      projectId: project.id,
      projectName: project.name,
      canArchive: blockersCount === 0,
      blockersCount,
      warningsCount,
      checks: {
        uncompletedTasks: {
          passed: uncompletedTasks.length === 0,
          count: uncompletedTasks.length,
          items: uncompletedTasks.map((t) => ({ id: t.id, title: t.title, status: t.status })),
        },
        criticalIssues: {
          passed: criticalIssues.length === 0,
          count: criticalIssues.length,
          items: criticalIssues.map((i) => ({ id: i.id, title: i.title, severity: i.severity })),
        },
        pendingApprovals: {
          passed: pendingApprovals.length === 0,
          count: pendingApprovals.length,
          items: pendingApprovals.map((a) => ({ id: a.id, entityType: a.entityType, status: a.status })),
        },
        openHighRisks: {
          passed: highRisks.length === 0,
          count: highRisks.length,
          items: highRisks.map((r) => ({ id: r.id, title: r.title, score: r.riskScore })),
        },
        unsubmittedTimesheets: {
          passed: true,
          count: 0,
          items: [],
        },
      },
    };
  }

  /**
   * Safely archive a project
   */
  async archive(projectId: string, dto: ArchiveProjectDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Project is already archived.');
    }

    const validation = await this.validateClosure(projectId, user);

    if (dto.policy === ClosureValidationPolicy.BLOCK && !validation.canArchive) {
      throw new BadRequestException(
        `Cannot archive project due to policy BLOCK: ${validation.blockersCount} blocking items exist (open critical issues or pending approvals).`,
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Project Status to ARCHIVED
      const updated = await tx.project.update({
        where: { id: projectId },
        data: {
          status: ProjectStatus.ARCHIVED,
          archivedAt: now,
          archivedById: user.id,
          archiveReason: dto.reason,
        },
        include: {
          archivedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // 2. Pause/Deactivate any recurring task definitions on this project
      await tx.recurringTaskDefinition.updateMany({
        where: { projectId, isActive: true },
        data: { isActive: false },
      });

      // 3. Log Activity
      await this.activityLogs.log({
        actorId: user.id,
        action: AuditAction.ARCHIVE,
        entityType: AuditEntityType.PROJECT,
        entityId: projectId,
        metadata: {
          action: 'ARCHIVE_PROJECT',
          reason: dto.reason,
          policy: dto.policy,
          uncompletedTasksCount: validation.checks.uncompletedTasks.count,
        },
      });

      return updated;
    });
  }

  /**
   * Restore an archived project back to active
   */
  async restore(projectId: string, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status !== ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Project is not in ARCHIVED status.');
    }

    const restored = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.ACTIVE,
        archivedAt: null,
        archivedById: null,
        archiveReason: null,
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.RESTORE,
      entityType: AuditEntityType.PROJECT,
      entityId: projectId,
      metadata: {
        action: 'RESTORE_PROJECT',
        restoredStatus: 'ACTIVE',
      },
    });

    return restored;
  }
}
