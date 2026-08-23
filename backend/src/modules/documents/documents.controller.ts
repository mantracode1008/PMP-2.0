import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents & Attachments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'List documents for a project' })
  @RequirePermissions('documents.read')
  @Get('projects/:projectId/documents')
  findAllByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findAllByProject(projectId, user);
  }

  @ApiOperation({ summary: 'List attachments for a task' })
  @RequirePermissions('documents.read')
  @Get('tasks/:taskId/attachments')
  findAllByTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.findAllByTask(taskId, user);
  }

  @ApiOperation({ summary: 'Upload document to project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  @Post('projects/:projectId/documents')
  uploadProjectDocument(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.uploadProjectDocument(projectId, file, user);
  }

  @ApiOperation({ summary: 'Upload attachment to task' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @RequirePermissions('documents.upload')
  @UseInterceptors(FileInterceptor('file'))
  @Post('tasks/:taskId/attachments')
  uploadTaskAttachment(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.uploadTaskAttachment(taskId, file, user);
  }

  @ApiOperation({ summary: 'Download document or attachment stream' })
  @RequirePermissions('documents.read')
  @Get('documents/:id/download')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const fileResult = await this.documentsService.getDownloadStream(id, user);

    res.set({
      'Content-Type': fileResult.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileResult.fileName)}"`,
      'Content-Length': fileResult.fileSize,
    });

    fileResult.stream.pipe(res);
  }

  @ApiOperation({ summary: 'Delete document or attachment' })
  @RequirePermissions('documents.delete')
  @Delete('documents/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.remove(id, user);
  }
}
