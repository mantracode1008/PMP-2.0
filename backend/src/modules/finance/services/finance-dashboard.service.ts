import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  FinanceDashboardQueryDto,
  PaymentReminderQueryDto,
  PaymentReminderStatusFilter,
  TeamMemberFinanceQueryDto,
} from '../dto/finance-query.dto';

export interface PaymentReminderItem {
  id: string; // Project ID
  projectId: string;
  projectCode: string;
  projectName: string;
  projectStatus: string;
  client: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone?: string | null;
  } | null;
  currency: string;
  projectValue: number;
  received: number;
  pending: number;
  nextPaymentDueDate: Date;
  nextPaymentAmount: number | null;
  paymentReminderNotes: string | null;
  urgencyStatus: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  daysRemaining: number; // negative for overdue, 0 for today, positive for upcoming
}

@Injectable()
export class FinanceDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Global Finance Dashboard Aggregation & Project Overview Table.
   */
  async getDashboardMetrics(query: FinanceDashboardQueryDto) {
    const whereProject: Prisma.ProjectWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      whereProject.status = query.status;
    }
    if (query.projectId) {
      whereProject.id = query.projectId;
    }
    if (query.search) {
      whereProject.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { client: { name: { contains: query.search, mode: 'insensitive' } } },
        { client: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // 1. Fetch all matching projects with financial relations
    const projects = await this.prisma.project.findMany({
      where: whereProject,
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true, phone: true },
        },
        financialSettings: true,
        clientPayments: {
          where: { deletedAt: null },
          select: { amount: true, paymentDate: true },
        },
        expenses: {
          where: { deletedAt: null },
          select: { amount: true, paymentDate: true, category: true, userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Compute project-level metrics
    let totalProjectValue = 0;
    let totalReceived = 0;
    let totalExpenses = 0;

    const projectSummaries = projects.map((p) => {
      const projectValue = p.financialSettings?.projectValue ?? 0;
      const currency = p.financialSettings?.currency ?? 'INR';
      const received = p.clientPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const pending = Math.max(0, projectValue - received);
      const expenses = p.expenses.reduce((acc, exp) => acc + exp.amount, 0);
      const currentCash = received - expenses;
      const expectedProfit = projectValue - expenses;

      totalProjectValue += projectValue;
      totalReceived += received;
      totalExpenses += expenses;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        client: p.client,
        currency,
        projectValue,
        received,
        pending,
        expenses,
        currentCash,
        expectedProfit,
        nextPaymentDueDate: p.financialSettings?.nextPaymentDueDate ?? null,
        nextPaymentAmount: p.financialSettings?.nextPaymentAmount ?? null,
        paymentReminderNotes: p.financialSettings?.paymentReminderNotes ?? null,
        paymentCount: p.clientPayments.length,
        expenseCount: p.expenses.length,
        isFullyPaid: projectValue > 0 && received >= projectValue,
      };
    });

    const totalPending = Math.max(0, totalProjectValue - totalReceived);
    const totalCashPosition = totalReceived - totalExpenses;
    const totalExpectedProfit = totalProjectValue - totalExpenses;

    // 3. Compute Payment Reminders Summary
    const remindersData = await this.getPaymentReminders({
      status: PaymentReminderStatusFilter.ALL,
      daysAhead: 7,
    });

    // Apply pagination to the table list
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedProjects = projectSummaries.slice(startIndex, startIndex + limit);

    return {
      metrics: {
        totalProjectValue,
        totalReceived,
        totalPending,
        totalExpenses,
        totalCashPosition,
        totalExpectedProfit,
        totalProjects: projects.length,
        projectsWithFinances: projectSummaries.filter((p) => p.projectValue > 0 || p.received > 0).length,
      },
      paymentRemindersSummary: remindersData.summary,
      urgentPaymentReminders: remindersData.reminders.slice(0, 5),
      projects: paginatedProjects,
      pagination: {
        page,
        limit,
        totalItems: projectSummaries.length,
        totalPages: Math.ceil(projectSummaries.length / limit),
      },
    };
  }

  /**
   * Client Payment Due Date Alerts & Reminders for Super Admin Dashboard.
   */
  async getPaymentReminders(query: PaymentReminderQueryDto) {
    const whereProject: Prisma.ProjectWhereInput = {
      deletedAt: null,
      financialSettings: {
        nextPaymentDueDate: { not: null },
      },
    };

    if (query.projectId) {
      whereProject.id = query.projectId;
    }

    const projects = await this.prisma.project.findMany({
      where: whereProject,
      include: {
        client: {
          select: { id: true, name: true, companyName: true, email: true, phone: true },
        },
        financialSettings: true,
        clientPayments: {
          where: { deletedAt: null },
          select: { amount: true },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysAhead = query.daysAhead ?? 7;
    const upcomingThreshold = new Date(today);
    upcomingThreshold.setDate(upcomingThreshold.getDate() + daysAhead);
    upcomingThreshold.setHours(23, 59, 59, 999);

    const allReminders: PaymentReminderItem[] = [];

    for (const p of projects) {
      if (!p.financialSettings || !p.financialSettings.nextPaymentDueDate) continue;

      const projectValue = p.financialSettings.projectValue ?? 0;
      const received = p.clientPayments.reduce((acc, pay) => acc + pay.amount, 0);
      const pending = Math.max(0, projectValue - received);

      // Skip if project is already 100% paid
      if (projectValue > 0 && pending <= 0) continue;

      const dueDate = new Date(p.financialSettings.nextPaymentDueDate);
      const dueDateMidnight = new Date(dueDate);
      dueDateMidnight.setHours(0, 0, 0, 0);

      const diffTime = dueDateMidnight.getTime() - today.getTime();
      const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let urgencyStatus: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

      if (daysRemaining < 0) {
        urgencyStatus = 'OVERDUE';
      } else if (daysRemaining === 0) {
        urgencyStatus = 'DUE_TODAY';
      } else {
        urgencyStatus = 'UPCOMING';
      }

      // Filter by daysAhead for upcoming (still keep overdue & due today)
      if (urgencyStatus === 'UPCOMING' && dueDateMidnight > upcomingThreshold) {
        continue;
      }

      allReminders.push({
        id: p.id,
        projectId: p.id,
        projectCode: p.code,
        projectName: p.name,
        projectStatus: p.status,
        client: p.client,
        currency: p.financialSettings.currency || 'INR',
        projectValue,
        received,
        pending,
        nextPaymentDueDate: dueDate,
        nextPaymentAmount: p.financialSettings.nextPaymentAmount ?? (pending > 0 ? pending : null),
        paymentReminderNotes: p.financialSettings.paymentReminderNotes ?? null,
        urgencyStatus,
        daysRemaining,
      });
    }

    // Sort: OVERDUE first (most overdue first), then DUE_TODAY, then UPCOMING (closest date first)
    allReminders.sort((a, b) => {
      const priorityOrder = { OVERDUE: 1, DUE_TODAY: 2, UPCOMING: 3 };
      if (priorityOrder[a.urgencyStatus] !== priorityOrder[b.urgencyStatus]) {
        return priorityOrder[a.urgencyStatus] - priorityOrder[b.urgencyStatus];
      }
      return a.nextPaymentDueDate.getTime() - b.nextPaymentDueDate.getTime();
    });

    const overdueCount = allReminders.filter((r) => r.urgencyStatus === 'OVERDUE').length;
    const dueTodayCount = allReminders.filter((r) => r.urgencyStatus === 'DUE_TODAY').length;
    const dueSoonCount = allReminders.filter((r) => r.urgencyStatus === 'UPCOMING').length;
    const totalAmountDue = allReminders.reduce(
      (acc, r) => acc + (r.nextPaymentAmount || r.pending),
      0,
    );

    let filteredReminders = allReminders;
    if (query.status && query.status !== PaymentReminderStatusFilter.ALL) {
      filteredReminders = allReminders.filter((r) => r.urgencyStatus === query.status);
    }

    return {
      summary: {
        totalReminders: allReminders.length,
        overdueCount,
        dueTodayCount,
        dueSoonCount,
        totalAmountDue,
      },
      reminders: filteredReminders,
    };
  }

  /**
   * Filtered summary of payments per team member across all projects.
   */
  async getTeamMemberPayments(query?: TeamMemberFinanceQueryDto) {
    const where: Prisma.ProjectExpenseWhereInput = {
      deletedAt: null,
      userId: { not: null },
    };

    if (query?.userId) {
      where.userId = query.userId;
    }
    if (query?.startDate || query?.endDate) {
      where.paymentDate = {};
      if (query.startDate) where.paymentDate.gte = query.startDate;
      if (query.endDate) where.paymentDate.lte = query.endDate;
    }

    const expenses = await this.prisma.projectExpense.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        project: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Group expenses by user
    const memberMap = new Map<
      string,
      {
        user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
        totalPaid: number;
        expenseCount: number;
        projectsMap: Map<
          string,
          {
            projectId: string;
            projectCode: string;
            projectName: string;
            totalAmount: number;
            expenseCount: number;
            lastPaymentDate: Date;
          }
        >;
      }
    >();

    for (const exp of expenses) {
      if (!exp.user || !exp.userId) continue;

      if (!memberMap.has(exp.userId)) {
        memberMap.set(exp.userId, {
          user: exp.user,
          totalPaid: 0,
          expenseCount: 0,
          projectsMap: new Map(),
        });
      }

      const member = memberMap.get(exp.userId)!;
      member.totalPaid += exp.amount;
      member.expenseCount += 1;

      if (!member.projectsMap.has(exp.projectId)) {
        member.projectsMap.set(exp.projectId, {
          projectId: exp.project.id,
          projectCode: exp.project.code,
          projectName: exp.project.name,
          totalAmount: 0,
          expenseCount: 0,
          lastPaymentDate: exp.paymentDate,
        });
      }

      const proj = member.projectsMap.get(exp.projectId)!;
      proj.totalAmount += exp.amount;
      proj.expenseCount += 1;
      if (exp.paymentDate > proj.lastPaymentDate) {
        proj.lastPaymentDate = exp.paymentDate;
      }
    }

    const result = Array.from(memberMap.values()).map((m) => ({
      user: m.user,
      totalPaid: m.totalPaid,
      expenseCount: m.expenseCount,
      projects: Array.from(m.projectsMap.values()),
    }));

    // Sort by totalPaid desc
    result.sort((a, b) => b.totalPaid - a.totalPaid);

    const grandTotal = result.reduce((acc, m) => acc + m.totalPaid, 0);

    return {
      grandTotal,
      totalMembers: result.length,
      members: result,
    };
  }

  /**
   * Retrieve financial audit logs for Super Admin.
   */
  async getFinancialAuditLogs(projectId?: string) {
    const where: Prisma.FinancialAuditLogWhereInput = {};
    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.financialAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  /**
   * Export financial summary to CSV.
   */
  async exportReportCsv(query: FinanceDashboardQueryDto): Promise<string> {
    const data = await this.getDashboardMetrics({ ...query, limit: 1000 });

    const headers = [
      'Project Code',
      'Project Name',
      'Client',
      'Status',
      'Project Value',
      'Received',
      'Pending',
      'Next Payment Due',
      'Next Payment Amount',
      'Expenses',
      'Cash Position',
      'Expected Profit',
      'Settled',
    ];

    const rows = data.projects.map((p) => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.client?.name || p.client?.companyName || 'N/A').replace(/"/g, '""')}"`,
      `"${p.status}"`,
      p.projectValue,
      p.received,
      p.pending,
      p.nextPaymentDueDate ? new Date(p.nextPaymentDueDate).toISOString().split('T')[0] : 'N/A',
      p.nextPaymentAmount ?? 'N/A',
      p.expenses,
      p.currentCash,
      p.expectedProfit,
      p.isFullyPaid ? 'YES' : 'NO',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

