import {
  Controller,
  Get,
  Header,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import {
  FinanceDashboardQueryDto,
  TeamMemberFinanceQueryDto,
} from '../dto/finance-query.dto';
import { FinanceDashboardService } from '../services/finance-dashboard.service';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeDashboardService: FinanceDashboardService,
  ) {}

  @Get('dashboard')
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'Get global financial dashboard metrics across projects' })
  getDashboardMetrics(@Query() query: FinanceDashboardQueryDto) {
    return this.financeDashboardService.getDashboardMetrics(query);
  }

  @Get('team-members')
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'Get team member payment totals and project breakdowns' })
  getTeamMemberPayments(@Query() query: TeamMemberFinanceQueryDto) {
    return this.financeDashboardService.getTeamMemberPayments(query);
  }

  @Get('audit-logs')
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'Get financial audit history' })
  getFinancialAuditLogs(@Query('projectId') projectId?: string) {
    return this.financeDashboardService.getFinancialAuditLogs(projectId);
  }

  @Get('export')
  @RequirePermissions('finance.export')
  @ApiOperation({ summary: 'Export project financial summary to CSV' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="financial-report.csv"')
  async exportReportCsv(@Query() query: FinanceDashboardQueryDto) {
    const csvContent = await this.financeDashboardService.exportReportCsv(query);
    return csvContent;
  }
}
