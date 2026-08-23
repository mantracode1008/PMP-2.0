import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateProjectExpenseDto,
  ProjectExpenseQueryDto,
  UpdateProjectExpenseDto,
} from '../dto/project-expense.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List expenses for a project with optional filters.
   */
  async getProjectExpenses(projectId: string, query?: ProjectExpenseQueryDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const where: Prisma.ProjectExpenseWhereInput = {
      projectId,
      deletedAt: null,
    };

    if (query?.category) {
      where.category = query.category;
    }
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
      orderBy: { paymentDate: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    return {
      projectId,
      totalExpenses,
      count: expenses.length,
      expenses,
    };
  }

  /**
   * Record a project expense.
   */
  async createExpense(
    projectId: string,
    dto: CreateProjectExpenseDto,
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user || user.deletedAt) {
        throw new BadRequestException(`Team member with ID "${dto.userId}" not found`);
      }
    }

    const expense = await this.prisma.projectExpense.create({
      data: {
        projectId,
        category: dto.category,
        userId: dto.userId || null,
        amount: dto.amount,
        paymentDate: dto.paymentDate || new Date(),
        paymentMethod: dto.paymentMethod || null,
        referenceNumber: dto.referenceNumber || null,
        description: dto.description,
        receiptUrl: dto.receiptUrl || null,
        createdById: actorId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'CREATE_EXPENSE',
        entityType: 'PROJECT_EXPENSE',
        entityId: expense.id,
        projectId,
        newValues: { ...expense },
      },
    });

    return expense;
  }

  /**
   * Edit an existing project expense.
   */
  async updateExpense(
    projectId: string,
    expenseId: string,
    dto: UpdateProjectExpenseDto,
    actorId: string,
  ) {
    const existingExpense = await this.prisma.projectExpense.findFirst({
      where: { id: expenseId, projectId, deletedAt: null },
    });

    if (!existingExpense) {
      throw new NotFoundException(
        `Expense with ID "${expenseId}" not found for this project`,
      );
    }

    if (dto.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user || user.deletedAt) {
        throw new BadRequestException(`Team member with ID "${dto.userId}" not found`);
      }
    }

    const updated = await this.prisma.projectExpense.update({
      where: { id: expenseId },
      data: {
        ...(dto.category && { category: dto.category }),
        ...(dto.userId !== undefined && { userId: dto.userId || null }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paymentDate && { paymentDate: dto.paymentDate }),
        ...(dto.paymentMethod !== undefined && { paymentMethod: dto.paymentMethod }),
        ...(dto.referenceNumber !== undefined && {
          referenceNumber: dto.referenceNumber,
        }),
        ...(dto.description && { description: dto.description }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'UPDATE_EXPENSE',
        entityType: 'PROJECT_EXPENSE',
        entityId: expenseId,
        projectId,
        previousValues: { ...existingExpense },
        newValues: { ...updated },
      },
    });

    return updated;
  }

  /**
   * Delete an expense (soft delete).
   */
  async deleteExpense(projectId: string, expenseId: string, actorId: string) {
    const existingExpense = await this.prisma.projectExpense.findFirst({
      where: { id: expenseId, projectId, deletedAt: null },
    });

    if (!existingExpense) {
      throw new NotFoundException(
        `Expense with ID "${expenseId}" not found for this project`,
      );
    }

    await this.prisma.projectExpense.update({
      where: { id: expenseId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'DELETE_EXPENSE',
        entityType: 'PROJECT_EXPENSE',
        entityId: expenseId,
        projectId,
        previousValues: { ...existingExpense },
      },
    });

    return { success: true, message: 'Project expense deleted successfully' };
  }
}
