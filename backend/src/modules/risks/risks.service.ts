import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  calculateRiskScore,
  CreateRiskDto,
  RiskQueryDto,
  UpdateRiskDto,
} from './dto/risk.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, Prisma, RiskImpact, RiskProbability, RiskStatus } from '@prisma/client';

@Injectable()
export class RisksService {
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
      include: { members: true },
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

  async create(projectId: string, dto: CreateRiskDto, user: AuthenticatedUser) {
    const project = await this.verifyProjectAccess(projectId, user);

    if (project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot add risks to an archived project.');
    }

    // Verify owner exists
    const owner = await this.prisma.user.findUnique({
      where: { id: dto.ownerId },
    });
    if (!owner || owner.deletedAt) {
      throw new NotFoundException(`Risk owner with ID "${dto.ownerId}" not found.`);
    }

    // Get next risk number
    const lastRisk = await this.prisma.risk.findFirst({
      where: { projectId },
      orderBy: { riskNumber: 'desc' },
      select: { riskNumber: true },
    });
    const riskNumber = (lastRisk?.riskNumber || 0) + 1;

    const riskScore = calculateRiskScore(dto.probability, dto.impact);

    const risk = await this.prisma.risk.create({
      data: {
        projectId,
        riskNumber,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        probability: dto.probability,
        impact: dto.impact,
        riskScore,
        ownerId: dto.ownerId,
        identifiedDate: dto.identifiedDate ? new Date(dto.identifiedDate) : new Date(),
        reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : null,
        mitigationPlan: dto.mitigationPlan,
        contingencyPlan: dto.contingencyPlan,
        createdById: user.id,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.RISK,
      entityId: risk.id,
      metadata: {
        projectId,
        riskNumber,
        title: risk.title,
        score: risk.riskScore,
      },
    });

    return risk;
  }

  async findAll(projectId: string, query: RiskQueryDto, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const {
      page = 1,
      limit = 20,
      status,
      category,
      probability,
      impact,
      ownerId,
      search,
      sortBy = 'riskScore',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.RiskWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (category) where.category = category;
    if (probability) where.probability = probability;
    if (impact) where.impact = impact;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { mitigationPlan: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, risks] = await Promise.all([
      this.prisma.risk.count({ where }),
      this.prisma.risk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { issues: true, attachments: true } },
        },
      }),
    ]);

    return createPaginatedResult(risks, total, page, limit);
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const risk = await this.prisma.risk.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true, status: true, ownerId: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        issues: {
          where: { deletedAt: null },
          select: { id: true, issueNumber: true, title: true, status: true, severity: true },
        },
        attachments: {
          where: { deletedAt: null },
          select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
        },
      },
    });

    if (!risk || risk.deletedAt) {
      throw new NotFoundException(`Risk with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(risk.projectId, user);
    return risk;
  }

  async update(id: string, dto: UpdateRiskDto, user: AuthenticatedUser) {
    const existing = await this.prisma.risk.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Risk with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot edit risks on an archived project.');
    }

    const data: Prisma.RiskUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.impact !== undefined) data.impact = dto.impact;

    // Recalculate risk score if probability or impact changed
    const newProb = dto.probability || existing.probability;
    const newImpact = dto.impact || existing.impact;
    data.riskScore = calculateRiskScore(newProb, newImpact);

    if (dto.ownerId !== undefined) {
      const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
      if (!owner || owner.deletedAt) {
        throw new NotFoundException(`User with ID "${dto.ownerId}" not found.`);
      }
      data.owner = { connect: { id: dto.ownerId } };
    }

    if (dto.identifiedDate !== undefined) {
      data.identifiedDate = new Date(dto.identifiedDate);
    }
    if (dto.reviewDate !== undefined) {
      data.reviewDate = dto.reviewDate ? new Date(dto.reviewDate) : null;
    }
    if (dto.mitigationPlan !== undefined) data.mitigationPlan = dto.mitigationPlan;
    if (dto.contingencyPlan !== undefined) data.contingencyPlan = dto.contingencyPlan;

    const updated = await this.prisma.risk.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: dto.status && dto.status !== existing.status ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE,
      entityType: AuditEntityType.RISK,
      entityId: updated.id,
      metadata: {
        projectId: updated.projectId,
        riskNumber: updated.riskNumber,
        oldStatus: existing.status,
        newStatus: updated.status,
        score: updated.riskScore,
      },
    });

    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.risk.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Risk with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(existing.projectId, user);

    if (existing.project.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot remove risks from an archived project.');
    }

    await this.prisma.risk.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.RISK,
      entityId: id,
      metadata: { projectId: existing.projectId, title: existing.title },
    });

    return { message: 'Risk removed successfully.' };
  }

  /**
   * Risk Matrix Aggregation
   * Returns a 4x4 grid: Probability (LOW, MEDIUM, HIGH, VERY_HIGH) x Impact (LOW, MEDIUM, HIGH, CRITICAL)
   */
  async getRiskMatrix(projectId: string, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    const risks = await this.prisma.risk.findMany({
      where: { projectId, deletedAt: null },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const probabilities = [
      RiskProbability.VERY_HIGH,
      RiskProbability.HIGH,
      RiskProbability.MEDIUM,
      RiskProbability.LOW,
    ];
    const impacts = [
      RiskImpact.LOW,
      RiskImpact.MEDIUM,
      RiskImpact.HIGH,
      RiskImpact.CRITICAL,
    ];

    const matrix: Record<
      string,
      Record<
        string,
        {
          score: number;
          level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
          count: number;
          risks: typeof risks;
        }
      >
    > = {};

    for (const prob of probabilities) {
      matrix[prob] = {};
      for (const imp of impacts) {
        const score = calculateRiskScore(prob, imp);
        let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (score >= 12) level = 'CRITICAL';
        else if (score >= 8) level = 'HIGH';
        else if (score >= 4) level = 'MEDIUM';

        const matchingRisks = risks.filter(
          (r) => r.probability === prob && r.impact === imp,
        );

        matrix[prob][imp] = {
          score,
          level,
          count: matchingRisks.length,
          risks: matchingRisks,
        };
      }
    }

    // Summary counters
    const summary = {
      totalRisks: risks.length,
      openRisks: risks.filter((r) => r.status === RiskStatus.OPEN || r.status === RiskStatus.MONITORING).length,
      highRisks: risks.filter((r) => r.riskScore >= 9 && r.status !== RiskStatus.CLOSED).length,
      mitigatedRisks: risks.filter((r) => r.status === RiskStatus.MITIGATED || r.status === RiskStatus.ACCEPTED).length,
      closedRisks: risks.filter((r) => r.status === RiskStatus.CLOSED).length,
    };

    return { matrix, summary };
  }
}
