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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import {
  CreateProjectExpenseDto,
  ProjectExpenseQueryDto,
  UpdateProjectExpenseDto,
} from '../dto/project-expense.dto';
import { ProjectExpensesService } from '../services/project-expenses.service';

@ApiTags('Project Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/expenses')
export class ProjectExpensesController {
  constructor(
    private readonly projectExpensesService: ProjectExpensesService,
  ) {}

  @Get()
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'List expenses for a project with optional filters' })
  getProjectExpenses(
    @Param('projectId') projectId: string,
    @Query() query: ProjectExpenseQueryDto,
  ) {
    return this.projectExpensesService.getProjectExpenses(projectId, query);
  }

  @Post()
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Record a project expense or team member payment' })
  createExpense(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectExpenseDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectExpensesService.createExpense(projectId, dto, actorId);
  }

  @Patch(':expenseId')
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Update a project expense' })
  updateExpense(
    @Param('projectId') projectId: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: UpdateProjectExpenseDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectExpensesService.updateExpense(
      projectId,
      expenseId,
      dto,
      actorId,
    );
  }

  @Delete(':expenseId')
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Delete a project expense' })
  deleteExpense(
    @Param('projectId') projectId: string,
    @Param('expenseId') expenseId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectExpensesService.deleteExpense(
      projectId,
      expenseId,
      actorId,
    );
  }
}
