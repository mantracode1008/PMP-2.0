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
import { RecurringTasksService } from './recurring-tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  CreateRecurringTaskDto,
  RecurringTaskQueryDto,
  UpdateRecurringTaskDto,
} from './dto/recurring-task.dto';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RecurringTasksController {
  constructor(private readonly recurringTasksService: RecurringTasksService) {}

  @Post('projects/:projectId/recurring-tasks')
  @RequirePermissions('recurring_tasks.create')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRecurringTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recurringTasksService.create(projectId, dto, user);
  }

  @Get('projects/:projectId/recurring-tasks')
  @RequirePermissions('recurring_tasks.read')
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: RecurringTaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recurringTasksService.findAll(projectId, query, user);
  }

  @Post('projects/:projectId/recurring-tasks/generate')
  @RequirePermissions('recurring_tasks.update')
  generateProjectDueTasks(@Param('projectId') projectId: string) {
    return this.recurringTasksService.generateDueTasks(projectId);
  }

  @Post('recurring-tasks/generate')
  @RequirePermissions('recurring_tasks.update')
  generateAllDueTasks() {
    return this.recurringTasksService.generateDueTasks();
  }

  @Get('recurring-tasks/:id')
  @RequirePermissions('recurring_tasks.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recurringTasksService.findOne(id, user);
  }

  @Patch('recurring-tasks/:id')
  @RequirePermissions('recurring_tasks.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recurringTasksService.update(id, dto, user);
  }

  @Delete('recurring-tasks/:id')
  @RequirePermissions('recurring_tasks.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.recurringTasksService.remove(id, user);
  }
}
