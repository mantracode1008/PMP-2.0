import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectPlanningService } from './project-planning.service';
import { CalendarQueryDto, DeadlineQueryDto } from './dto/planning.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Planning, Timeline & Progress')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class ProjectPlanningController {
  constructor(private readonly planningService: ProjectPlanningService) {}

  @ApiOperation({ summary: 'Calculate centralized effort-weighted project progress & historical trend' })
  @RequirePermissions('progress.read')
  @Get('projects/:projectId/progress')
  calculateProjectProgress(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.calculateProjectProgress(projectId, user);
  }

  @ApiOperation({ summary: 'Get project timeline tree for Gantt view (Milestones -> Tasks -> Subtasks)' })
  @RequirePermissions('timeline.read')
  @Get('projects/:projectId/timeline')
  getProjectTimeline(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.getProjectTimeline(projectId, user);
  }

  @ApiOperation({ summary: 'Get project calendar events (Tasks, Milestones, Deadlines)' })
  @RequirePermissions('calendar.read')
  @Get('projects/:projectId/calendar')
  getProjectCalendar(
    @Param('projectId') projectId: string,
    @Query() query: CalendarQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.getProjectCalendar(projectId, query, user);
  }

  @ApiOperation({ summary: 'Get project time summary (Estimated vs Actual logged hours, Over-estimate tasks)' })
  @RequirePermissions('worklogs.read')
  @Get('projects/:projectId/time-summary')
  getProjectTimeSummary(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.getProjectTimeSummary(projectId, user);
  }

  @ApiOperation({ summary: 'Get deadline monitoring status (Overdue, Due Today, Due Soon)' })
  @RequirePermissions('tasks.read')
  @Get('planning/deadlines')
  getDeadlines(
    @Query() query: DeadlineQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.planningService.getDeadlines(query, user);
  }
}
