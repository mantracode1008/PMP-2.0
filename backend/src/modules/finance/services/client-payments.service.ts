import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateClientPaymentDto,
  UpdateClientPaymentDto,
} from '../dto/client-payment.dto';

@Injectable()
export class ClientPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List client payments for a project.
   */
  async getProjectPayments(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { financialSettings: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const payments = await this.prisma.clientPayment.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { paymentDate: 'desc' },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const projectValue = project.financialSettings?.projectValue ?? 0;
    const totalReceived = payments.reduce((acc, p) => acc + p.amount, 0);
    const remainingAmount = Math.max(0, projectValue - totalReceived);

    return {
      projectId,
      projectValue,
      totalReceived,
      remainingAmount,
      payments,
    };
  }

  /**
   * Record a payment received from the client with overpayment protection.
   */
  async createPayment(
    projectId: string,
    dto: CreateClientPaymentDto,
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { financialSettings: true },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const projectValue = project.financialSettings?.projectValue ?? 0;

    if (projectValue <= 0) {
      throw new BadRequestException(
        'Cannot record client payment: Please set a valid Project Financial Value first.',
      );
    }

    // Existing active payments
    const existingPayments = await this.prisma.clientPayment.findMany({
      where: { projectId, deletedAt: null },
      select: { amount: true },
    });
    const currentReceived = existingPayments.reduce(
      (acc, p) => acc + p.amount,
      0,
    );
    const remainingBalance = Math.max(0, projectValue - currentReceived);

    if (currentReceived + dto.amount > projectValue) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining project balance (${remainingBalance}). Maximum allowed payment is ${remainingBalance}.`,
      );
    }

    const payment = await this.prisma.clientPayment.create({
      data: {
        projectId,
        amount: dto.amount,
        paymentDate: dto.paymentDate || new Date(),
        paymentMethod: dto.paymentMethod || 'UPI',
        referenceNumber: dto.referenceNumber || null,
        notes: dto.notes || null,
        createdById: actorId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'CREATE_PAYMENT',
        entityType: 'CLIENT_PAYMENT',
        entityId: payment.id,
        projectId,
        newValues: { ...payment },
      },
    });

    return payment;
  }

  /**
   * Edit an existing client payment entry.
   */
  async updatePayment(
    projectId: string,
    paymentId: string,
    dto: UpdateClientPaymentDto,
    actorId: string,
  ) {
    const existingPayment = await this.prisma.clientPayment.findFirst({
      where: { id: paymentId, projectId, deletedAt: null },
      include: { project: { include: { financialSettings: true } } },
    });

    if (!existingPayment) {
      throw new NotFoundException(
        `Client payment with ID "${paymentId}" not found for this project`,
      );
    }

    const projectValue =
      existingPayment.project.financialSettings?.projectValue ?? 0;

    if (dto.amount !== undefined && dto.amount !== existingPayment.amount) {
      const otherPayments = await this.prisma.clientPayment.findMany({
        where: {
          projectId,
          deletedAt: null,
          id: { not: paymentId },
        },
        select: { amount: true },
      });
      const otherTotal = otherPayments.reduce((acc, p) => acc + p.amount, 0);

      if (otherTotal + dto.amount > projectValue) {
        const allowedMax = Math.max(0, projectValue - otherTotal);
        throw new BadRequestException(
          `Updated payment amount (${dto.amount}) exceeds remaining project balance. Maximum allowable amount is ${allowedMax}.`,
        );
      }
    }

    const updated = await this.prisma.clientPayment.update({
      where: { id: paymentId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.paymentDate && { paymentDate: dto.paymentDate }),
        ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod }),
        ...(dto.referenceNumber !== undefined && {
          referenceNumber: dto.referenceNumber,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'UPDATE_PAYMENT',
        entityType: 'CLIENT_PAYMENT',
        entityId: paymentId,
        projectId,
        previousValues: { ...existingPayment },
        newValues: { ...updated },
      },
    });

    return updated;
  }

  /**
   * Delete a client payment (soft delete).
   */
  async deletePayment(projectId: string, paymentId: string, actorId: string) {
    const existingPayment = await this.prisma.clientPayment.findFirst({
      where: { id: paymentId, projectId, deletedAt: null },
    });

    if (!existingPayment) {
      throw new NotFoundException(
        `Client payment with ID "${paymentId}" not found for this project`,
      );
    }

    const deleted = await this.prisma.clientPayment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.prisma.financialAuditLog.create({
      data: {
        actorId,
        action: 'DELETE_PAYMENT',
        entityType: 'CLIENT_PAYMENT',
        entityId: paymentId,
        projectId,
        previousValues: { ...existingPayment },
      },
    });

    return { success: true, message: 'Client payment deleted successfully' };
  }
}
