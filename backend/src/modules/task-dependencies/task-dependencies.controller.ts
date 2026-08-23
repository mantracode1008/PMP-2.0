import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TaskDependenciesService } from './task-dependencies.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Task Dependencies')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tasks/:taskId/dependencies')
export class TaskDependenciesController {
  constructor(private readonly dependenciesService: TaskDependenciesService) {}

  @ApiOperation({ summary: 'Add task dependency' })
  @RequirePermissions('tasks.update')
  @Post()
  addDependency(
    @Param('taskId') taskId: string,
    @Body() dto: CreateDependencyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dependenciesService.addDependency(taskId, dto, user);
  }

  @ApiOperation({ summary: 'Remove task dependency' })
  @RequirePermissions('tasks.update')
  @Delete(':dependsOnTaskId')
  removeDependency(
    @Param('taskId') taskId: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dependenciesService.removeDependency(taskId, dependsOnTaskId, user);
  }
}
