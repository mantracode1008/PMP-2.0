import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import {
  SetProjectFinancialDto,
  UpdateProjectFinancialDto,
} from '../dto/project-financial.dto';
import { ProjectFinancialsService } from '../services/project-financials.service';

@ApiTags('Project Financials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/financials')
export class ProjectFinancialsController {
  constructor(
    private readonly projectFinancialsService: ProjectFinancialsService,
  ) {}

  @Get()
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'Get project financial metrics, payments, and expenses' })
  getProjectFinancials(@Param('projectId') projectId: string) {
    return this.projectFinancialsService.getProjectFinancials(projectId);
  }

  @Post()
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Set or initialize project financial value' })
  setProjectFinancials(
    @Param('projectId') projectId: string,
    @Body() dto: SetProjectFinancialDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectFinancialsService.setProjectFinancials(
      projectId,
      dto,
      actorId,
    );
  }

  @Patch()
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Update project financial settings' })
  updateProjectFinancials(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectFinancialDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectFinancialsService.updateProjectFinancials(
      projectId,
      dto,
      actorId,
    );
  }
}
