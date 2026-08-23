import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  CreateProjectTemplateDto,
  CreateTaskTemplateDto,
  InstantiateProjectTemplateDto,
  TemplateQueryDto,
  UpdateProjectTemplateDto,
} from './dto/template.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import {
  AuditAction,
  AuditEntityType,
  MilestoneStatus,
  Prisma,
  ProjectHealth,
  ProjectMemberRole,
  ProjectStatus,
  TaskStatus,
} from '@prisma/client';

@Injectable()
export class TemplatesService {
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

  // --- PROJECT TEMPLATES ---

  async createProjectTemplate(dto: CreateProjectTemplateDto, user: AuthenticatedUser) {
    const existing = await this.prisma.projectTemplate.findUnique({
      where: { name: dto.name },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException(`Project template with name "${dto.name}" already exists.`);
    }

    const template = await this.prisma.projectTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        estimatedDurationDays: dto.estimatedDurationDays || 30,
        defaultRoles: dto.defaultRoles || ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA'],
        createdById: user.id,
        milestones: dto.milestones
          ? {
              create: dto.milestones.map((m, mIdx) => ({
                name: m.name,
                description: m.description,
                orderIndex: m.orderIndex ?? mIdx,
                targetDayOffset: m.targetDayOffset || 0,
                tasks: m.tasks
                  ? {
                      create: m.tasks.map((t, tIdx) => ({
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                        estimatedHours: t.estimatedHours,
                        defaultRole: t.defaultRole,
                        orderIndex: t.orderIndex ?? tIdx,
                        targetDayOffset: t.targetDayOffset || 0,
                        checklist: t.checklist ? (t.checklist as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.PROJECT_TEMPLATE,
      entityId: template.id,
      metadata: { name: template.name },
    });

    return template;
  }

  async findAllProjectTemplates(query: TemplateQueryDto) {
    const { page = 1, limit = 20, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectTemplateWhereInput = {
      deletedAt: null,
    };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.projectTemplate.count({ where }),
      this.prisma.projectTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { milestones: true, tasks: true } },
        },
      }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async findOneProjectTemplate(id: string) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: {
              orderBy: { orderIndex: 'asc' },
              include: {
                dependencies: { include: { dependsOnTaskTemplate: true } },
              },
            },
          },
        },
        tasks: {
          where: { milestoneTemplateId: null },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!template || template.deletedAt) {
      throw new NotFoundException(`Project template with ID "${id}" not found.`);
    }

    return template;
  }

  async updateProjectTemplate(id: string, dto: UpdateProjectTemplateDto, user: AuthenticatedUser) {
    const existing = await this.prisma.projectTemplate.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Project template with ID "${id}" not found.`);
    }

    const updated = await this.prisma.projectTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        estimatedDurationDays: dto.estimatedDurationDays,
        defaultRoles: dto.defaultRoles,
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.PROJECT_TEMPLATE,
      entityId: id,
      metadata: { name: updated.name },
    });

    return updated;
  }

  async removeProjectTemplate(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.projectTemplate.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Project template with ID "${id}" not found.`);
    }

    await this.prisma.projectTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.PROJECT_TEMPLATE,
      entityId: id,
      metadata: { name: existing.name },
    });

    return { message: 'Project template removed successfully.' };
  }

  /**
   * Guided Project Instantiation from Template with Transaction Rollback
   */
  async instantiateTemplate(
    templateId: string,
    dto: InstantiateProjectTemplateDto,
    user: AuthenticatedUser,
  ) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id: templateId },
      include: {
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            tasks: { orderBy: { orderIndex: 'asc' } },
          },
        },
        tasks: {
          where: { milestoneTemplateId: null },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!template || template.deletedAt) {
      throw new NotFoundException(`Project template with ID "${templateId}" not found.`);
    }

    // Validate Project Code uniqueness
    const codeCheck = await this.prisma.project.findUnique({
      where: { code: dto.code },
    });
    if (codeCheck && !codeCheck.deletedAt) {
      throw new ConflictException(`Project code "${dto.code}" is already in use.`);
    }

    // Validate Client and Owner
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || client.deletedAt) throw new NotFoundException(`Client with ID "${dto.clientId}" not found.`);

    const owner = await this.prisma.user.findUnique({ where: { id: dto.ownerId } });
    if (!owner || owner.deletedAt) throw new NotFoundException(`Project owner with ID "${dto.ownerId}" not found.`);

    // Execute atomic transactional generation
    return this.prisma.$transaction(async (tx) => {
      const startDate = new Date(dto.startDate);
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + (template.estimatedDurationDays || 30));

      // 1. Create Project
      const project = await tx.project.create({
        data: {
          code: dto.code,
          name: dto.name,
          description: dto.description || template.description,
          clientId: dto.clientId,
          ownerId: dto.ownerId,
          status: ProjectStatus.PLANNING,
          health: ProjectHealth.HEALTHY,
          calculatedHealth: ProjectHealth.HEALTHY,
          startDate,
          targetDate,
        },
      });

      // 2. Add Project Owner as Member
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: dto.ownerId,
          projectRole: ProjectMemberRole.MANAGER,
        },
      });

      // Map role placeholders to user IDs
      const roleMap = dto.roleMappings || {};
      const uniqueMappedUserIds = new Set<string>(Object.values(roleMap));

      // Add mapped users to project members
      for (const mappedUserId of uniqueMappedUserIds) {
        if (mappedUserId && mappedUserId !== dto.ownerId) {
          const userCheck = await tx.user.findUnique({ where: { id: mappedUserId } });
          if (userCheck && !userCheck.deletedAt) {
            await tx.projectMember.upsert({
              where: { projectId_userId: { projectId: project.id, userId: mappedUserId } },
              update: {},
              create: {
                projectId: project.id,
                userId: mappedUserId,
                projectRole: ProjectMemberRole.MEMBER,
              },
            });
          }
        }
      }

      let taskCounter = 1;
      const createdMilestoneMap = new Map<string, string>(); // templateMilestoneId -> realMilestoneId
      const createdTaskTemplateMap = new Map<string, string>(); // taskTemplateId -> realTaskId

      // 3. Create Milestones & Tasks
      for (const mTemplate of template.milestones) {
        const mDueDate = new Date(startDate);
        mDueDate.setDate(mDueDate.getDate() + (mTemplate.targetDayOffset || 14));

        const milestone = await tx.milestone.create({
          data: {
            projectId: project.id,
            name: mTemplate.name,
            description: mTemplate.description,
            status: MilestoneStatus.NOT_STARTED,
            startDate,
            dueDate: mDueDate,
            createdById: user.id,
          },
        });
        createdMilestoneMap.set(mTemplate.id, milestone.id);

        for (const tTemplate of mTemplate.tasks) {
          const tDueDate = new Date(startDate);
          tDueDate.setDate(tDueDate.getDate() + (tTemplate.targetDayOffset || mTemplate.targetDayOffset || 7));

          const assignedUserId = tTemplate.defaultRole ? roleMap[tTemplate.defaultRole] : undefined;

          const task = await tx.task.create({
            data: {
              projectId: project.id,
              milestoneId: milestone.id,
              taskNumber: taskCounter++,
              title: tTemplate.title,
              description: tTemplate.description,
              priority: tTemplate.priority,
              estimatedHours: tTemplate.estimatedHours,
              status: TaskStatus.TODO,
              progress: 0,
              startDate,
              dueDate: tDueDate,
              createdById: user.id,
              assignees: assignedUserId
                ? {
                    create: { userId: assignedUserId },
                  }
                : undefined,
            },
          });
          createdTaskTemplateMap.set(tTemplate.id, task.id);
        }
      }

      // 4. Create Standalone Tasks from Template
      for (const tTemplate of template.tasks) {
        const tDueDate = new Date(startDate);
        tDueDate.setDate(tDueDate.getDate() + (tTemplate.targetDayOffset || 14));
        const assignedUserId = tTemplate.defaultRole ? roleMap[tTemplate.defaultRole] : undefined;

        const task = await tx.task.create({
          data: {
            projectId: project.id,
            taskNumber: taskCounter++,
            title: tTemplate.title,
            description: tTemplate.description,
            priority: tTemplate.priority,
            estimatedHours: tTemplate.estimatedHours,
            status: TaskStatus.TODO,
            progress: 0,
            startDate,
            dueDate: tDueDate,
            createdById: user.id,
            assignees: assignedUserId
              ? {
                  create: { userId: assignedUserId },
                }
              : undefined,
          },
        });
        createdTaskTemplateMap.set(tTemplate.id, task.id);
      }

      await this.activityLogs.log({
        actorId: user.id,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.PROJECT,
        entityId: project.id,
        metadata: {
          action: 'INSTANTIATE_FROM_TEMPLATE',
          templateId,
          templateName: template.name,
          milestonesCreated: template.milestones.length,
          tasksCreated: taskCounter - 1,
        },
      });

      return tx.project.findUnique({
        where: { id: project.id },
        include: {
          client: true,
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
          members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
          milestones: { include: { tasks: true } },
        },
      });
    });
  }

  // --- STANDALONE TASK TEMPLATES ---

  async createTaskTemplate(dto: CreateTaskTemplateDto, user: AuthenticatedUser) {
    const taskTemplate = await this.prisma.taskTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        estimatedHours: dto.estimatedHours,
        defaultRole: dto.defaultRole,
        checklist: dto.checklist ? (dto.checklist as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        isStandalone: true,
      },
    });

    return taskTemplate;
  }

  async findAllTaskTemplates() {
    return this.prisma.taskTemplate.findMany({
      where: { isStandalone: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
