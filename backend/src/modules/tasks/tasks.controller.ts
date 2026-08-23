import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'List tasks for a project' })
  @RequirePermissions('tasks.read')
  @Get('projects/:projectId/tasks')
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query() query: TaskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.findAllByProject(projectId, query, user);
  }

  @ApiOperation({ summary: 'Create task or subtask' })
  @RequirePermissions('tasks.create')
  @Post('projects/:projectId/tasks')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.create(projectId, dto, user);
  }

  @ApiOperation({ summary: 'Get full task details by ID' })
  @RequirePermissions('tasks.read')
  @Get('tasks/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Update task details' })
  @RequirePermissions('tasks.update')
  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @ApiOperation({ summary: 'Quick update task status (Kanban drag-and-drop)' })
  @RequirePermissions('tasks.update')
  @Put('tasks/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.updateStatus(id, dto, user);
  }

  @ApiOperation({ summary: 'Assign members to task' })
  @RequirePermissions('tasks.assign')
  @Post('tasks/:id/assignees')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tasksService.assign(id, dto, user);
  }

  @ApiOperation({ summary: 'Archive task' })
  @RequirePermissions('tasks.delete')
  @Delete('tasks/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.remove(id, user);
  }
}
