import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ClientQueryDto, CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { AuditAction, AuditEntityType, GeneralStatus, Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async findAll(query: ClientQueryDto) {
    const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ClientWhereInput = {
      deletedAt: null,
    };

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, clients] = await Promise.all([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              projects: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const formatted = clients.map((c) => ({
      ...c,
      projectCount: c._count.projects,
      _count: undefined,
    }));

    return createPaginatedResult(formatted, total, page, limit);
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            health: true,
            startDate: true,
            targetDate: true,
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!client || client.deletedAt) {
      throw new NotFoundException(`Client with ID "${id}" not found.`);
    }

    return client;
  }

  async create(dto: CreateClientDto, actorId?: string) {
    const existing = await this.prisma.client.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`Client with email "${dto.email}" already exists.`);
    }

    const client = await this.prisma.client.create({
      data: {
        name: dto.name.trim(),
        companyName: dto.companyName.trim(),
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        website: dto.website,
        address: dto.address,
        status: dto.status || GeneralStatus.ACTIVE,
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.CLIENT,
      entityId: client.id,
      metadata: { name: client.name, company: client.companyName },
    });

    return client;
  }

  async update(id: string, dto: UpdateClientDto, actorId?: string) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.client.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new BadRequestException(`Client with email "${dto.email}" already exists.`);
      }
    }

    const updateData: Prisma.ClientUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.companyName !== undefined) updateData.companyName = dto.companyName.trim();
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.status !== undefined) updateData.status = dto.status;

    const updated = await this.prisma.client.update({
      where: { id },
      data: updateData,
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.CLIENT,
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const client = await this.findOne(id);

    await this.prisma.client.update({
      where: { id },
      data: {
        status: GeneralStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });

    await this.activityLogs.log({
      actorId,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.CLIENT,
      entityId: id,
      metadata: { name: client.name },
    });

    return { success: true, message: 'Client archived successfully.' };
  }

  async getMetrics() {
    const [totalClients, activeClients] = await Promise.all([
      this.prisma.client.count({ where: { deletedAt: null } }),
      this.prisma.client.count({ where: { status: GeneralStatus.ACTIVE, deletedAt: null } }),
    ]);

    return { totalClients, activeClients };
  }
}
