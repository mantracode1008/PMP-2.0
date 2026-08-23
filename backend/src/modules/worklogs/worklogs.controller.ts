import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkLogsService } from './worklogs.service';
import { CreateWorkLogDto, UpdateWorkLogDto, WorkLogQueryDto } from './dto/worklog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Work Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class WorkLogsController {
  constructor(private readonly workLogsService: WorkLogsService) {}

  @ApiOperation({ summary: 'Log work time against a task in a project' })
  @RequirePermissions('worklogs.create')
  @Post('projects/:projectId/tasks/:taskId/worklogs')
  create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateWorkLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.create(projectId, taskId, dto, user);
  }

  @ApiOperation({ summary: 'Get task time tracking summary (estimated, logged, remaining, over estimate)' })
  @RequirePermissions('worklogs.read')
  @Get('tasks/:taskId/time-summary')
  getTaskTimeSummary(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.getTaskTimeSummary(taskId, user);
  }

  @ApiOperation({ summary: 'List work logs with filters and aggregations' })
  @RequirePermissions('worklogs.read')
  @Get('worklogs')
  findAll(
    @Query() query: WorkLogQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.findAll(query, user);
  }

  @ApiOperation({ summary: 'Get a single work log by ID' })
  @RequirePermissions('worklogs.read')
  @Get('worklogs/:id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Update an existing work log' })
  @RequirePermissions('worklogs.update')
  @Patch('worklogs/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.update(id, dto, user);
  }

  @ApiOperation({ summary: 'Delete a work log' })
  @RequirePermissions('worklogs.delete')
  @Delete('worklogs/:id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workLogsService.remove(id, user);
  }
}
