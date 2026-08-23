import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectHealthService } from './project-health.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { OverrideHealthDto } from './dto/project-health.dto';

@Controller('projects/:projectId/health')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectHealthController {
  constructor(private readonly projectHealthService: ProjectHealthService) {}

  @Get()
  @RequirePermissions('projects.read')
  getHealth(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectHealthService.computeHealth(projectId, user);
  }

  @Post('override')
  @RequirePermissions('projects.health_override')
  overrideHealth(
    @Param('projectId') projectId: string,
    @Body() dto: OverrideHealthDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectHealthService.overrideHealth(projectId, dto, user);
  }

  @Post('reset')
  @RequirePermissions('projects.health_override')
  resetHealth(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectHealthService.resetHealthOverride(projectId, user);
  }
}
