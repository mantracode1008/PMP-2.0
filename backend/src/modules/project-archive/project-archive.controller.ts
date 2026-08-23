import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectArchiveService } from './project-archive.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ArchiveProjectDto } from './dto/project-archive.dto';

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectArchiveController {
  constructor(private readonly projectArchiveService: ProjectArchiveService) {}

  @Get('closure-check')
  @RequirePermissions('projects.read')
  validateClosure(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectArchiveService.validateClosure(projectId, user);
  }

  @Post('archive')
  @RequirePermissions('projects.archive')
  archive(
    @Param('projectId') projectId: string,
    @Body() dto: ArchiveProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectArchiveService.archive(projectId, dto, user);
  }

  @Post('restore')
  @RequirePermissions('projects.restore')
  restore(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectArchiveService.restore(projectId, user);
  }
}
