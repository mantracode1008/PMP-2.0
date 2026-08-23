import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  SetProjectFinancialDto,
  UpdateProjectFinancialDto,
} from '../dto/project-financial.dto';

@Injectable()
export class ProjectFinancialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve calculated financial metrics and summary for a project.
   */
  async getProjectFinancials(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        financialSettings: true,
        client: {
          select: { id: true, name: true, companyName: true },
        },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // 1. Fetch Client Payments
    const clientPayments = await this.prisma.clientPayment.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // 2. Fetch Project Expenses
    const projectExpenses = await this.prisma.projectExpense.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const projectValue = project.financialSettings?.projectValue ?? 0;
    const currency = project.financialSettings?.currency ?? 'INR';

    const totalReceived = clientPayments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = Math.max(0, projectValue - totalReceived);
    const totalExpenses = projectExpenses.reduce((acc, e) => acc + e.amount, 0);
    const currentCashPosition = totalReceived - totalExpenses;
    const expectedProfit = projectValue - totalExpenses;

    const teamMemberExpenses = projectExpenses.filter((e) =>
      [
        'TEAM_MEMBER_PAYMENT',
        'DEVELOPER_PAYMENT',
        'DESIGNER_PAYMENT',
        'FREELANCER_PAYMENT',
      ].includes(e.category) || e.userId !== null,
    );
    const totalTeamMemberPayments = teamMemberExpenses.reduce(
      (acc, e) => acc + e.amount,
      0,
    );

    return {
      projectId: project.id,
      projectCode: project.code,
      projectName: project.name,
      projectStatus: project.status,
      client: project.client,
      financialSettings: project.financialSettings,
      metrics: {
        currency,
        projectValue,
        totalReceived,
        remainingAmount,
        totalExpenses,
        currentCashPosition,
        expectedProfit,
        totalTeamMemberPayments,
        isFullyPaid: projectValue > 0 && totalReceived >= projectValue,
      },
      clientPayments,
      projectExpenses,
    };
  }

  /**
   * Set or update project financial value & currency.
   */
  async setProjectFinancials(
    projectId: string,
    dto: SetProjectFinancialDto,
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { financialSettings: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    // Verify project value is not lower than already received payments
    const payments = await this.prisma.clientPayment.findMany({
      where: { projectId, deletedAt: null },
      select: { amount: true },
    });
    const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);

    if (dto.projectValue < totalReceived) {
      throw new BadRequestException(
        `Project value cannot be set lower than total client payments already received (${totalReceived})`,
      );
    }

    const previousSettings = project.financialSettings;

    const settings = await this.prisma.projectFinancial.upsert({
      where: { projectId },
      update: {
        projectValue: dto.projectValue,
        currency: dto.currency || previousSettings?.currency || 'INR',
      },
      create: {
        projectId,
        projectValue: dto.projectValue,
        currency: dto.currency || 'INR',
        createdById: actorId,
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'SET_PROJECT_VALUE',
        entityType: 'PROJECT_FINANCIAL',
        entityId: settings.id,
        projectId,
        previousValues: previousSettings ? { ...previousSettings } : undefined,
        newValues: { ...settings },
      },
    });

    return this.getProjectFinancials(projectId);
  }

  /**
   * Partial update of project financial settings.
   */
  async updateProjectFinancials(
    projectId: string,
    dto: UpdateProjectFinancialDto,
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { financialSettings: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    if (dto.projectValue !== undefined) {
      const payments = await this.prisma.clientPayment.findMany({
        where: { projectId, deletedAt: null },
        select: { amount: true },
      });
      const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);

      if (dto.projectValue < totalReceived) {
        throw new BadRequestException(
          `Project value cannot be set lower than total client payments already received (${totalReceived})`,
        );
      }
    }

    const previousSettings = project.financialSettings;

    const settings = await this.prisma.projectFinancial.upsert({
      where: { projectId },
      update: {
        ...(dto.projectValue !== undefined && { projectValue: dto.projectValue }),
        ...(dto.currency && { currency: dto.currency }),
      },
      create: {
        projectId,
        projectValue: dto.projectValue ?? 0,
        currency: dto.currency || 'INR',
        createdById: actorId,
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'UPDATE_PROJECT_VALUE',
        entityType: 'PROJECT_FINANCIAL',
        entityId: settings.id,
        projectId,
        previousValues: previousSettings ? { ...previousSettings } : undefined,
        newValues: { ...settings },
      },
    });

    return this.getProjectFinancials(projectId);
  }
}
