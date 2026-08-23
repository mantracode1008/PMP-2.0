import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { LocalStorageService } from './storage/local-storage.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuditAction, AuditEntityType, DocumentEntityType } from '@prisma/client';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalStorageService,
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

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed limit of 25MB.`);
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not supported. Supported: PDF, Images, Office Docs, CSV, Zip, Text.`,
      );
    }
  }

  async findAllByProject(projectId: string, user: AuthenticatedUser) {
    await this.verifyProjectAccess(projectId, user);

    return this.prisma.document.findMany({
      where: {
        projectId,
        entityType: DocumentEntityType.PROJECT,
        deletedAt: null,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTask(taskId: string, user: AuthenticatedUser) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found.');

    await this.verifyProjectAccess(task.projectId, user);

    return this.prisma.document.findMany({
      where: {
        taskId,
        entityType: DocumentEntityType.TASK,
        deletedAt: null,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadProjectDocument(
    projectId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    await this.verifyProjectAccess(projectId, user);
    this.validateFile(file);

    const stored = await this.storage.saveFile(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      `projects/${projectId}`,
    );

    const document = await this.prisma.document.create({
      data: {
        entityType: DocumentEntityType.PROJECT,
        projectId,
        fileName: stored.fileName,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath: stored.storagePath,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPLOAD,
      entityType: AuditEntityType.DOCUMENT,
      entityId: document.id,
      metadata: { originalFileName: file.originalname, projectId },
    });

    return document;
  }

  async uploadTaskAttachment(
    taskId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, taskNumber: true },
    });

    if (!task) throw new NotFoundException('Task not found.');
    await this.verifyProjectAccess(task.projectId, user);
    this.validateFile(file);

    const stored = await this.storage.saveFile(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      `tasks/${taskId}`,
    );

    const document = await this.prisma.document.create({
      data: {
        entityType: DocumentEntityType.TASK,
        projectId: task.projectId,
        taskId,
        fileName: stored.fileName,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath: stored.storagePath,
        uploadedById: user.id,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.UPLOAD,
      entityType: AuditEntityType.DOCUMENT,
      entityId: document.id,
      metadata: { originalFileName: file.originalname, taskId, taskNumber: task.taskNumber },
    });

    return document;
  }

  async getDownloadStream(id: string, user: AuthenticatedUser) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException(`Document with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(document.projectId, user);

    const stream = await this.storage.getFileStream(document.storagePath);
    return {
      stream,
      fileName: document.originalFileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
    };
  }

  async remove(id: string, user: AuthenticatedUser) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document || document.deletedAt) {
      throw new NotFoundException(`Document with ID "${id}" not found.`);
    }

    await this.verifyProjectAccess(document.projectId, user);

    if (document.uploadedById !== user.id && !this.isElevatedUser(user)) {
      throw new ForbiddenException('You can only delete documents you uploaded.');
    }

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Optionally delete from disk storage
    await this.storage.deleteFile(document.storagePath).catch(() => {});

    await this.activityLogs.log({
      actorId: user.id,
      action: AuditAction.DELETE,
      entityType: AuditEntityType.DOCUMENT,
      entityId: id,
      metadata: { fileName: document.originalFileName, projectId: document.projectId },
    });

    return { success: true, message: 'Document deleted.' };
  }
}
