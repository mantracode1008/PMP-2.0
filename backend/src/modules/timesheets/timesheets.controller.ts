import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetsService } from './timesheets.service';
import { RejectTimesheetDto, TimesheetQueryDto } from './dto/timesheet.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Timesheets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @ApiOperation({ summary: 'Get current user weekly timesheet spreadsheet grid' })
  @RequirePermissions('timesheets.read')
  @Get('my')
  getMyWeeklyTimesheet(
    @Query('weekDate') weekDate: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.getMyWeeklyTimesheet(user, weekDate);
  }

  @ApiOperation({ summary: 'List timesheets with status, user and date filters' })
  @RequirePermissions('timesheets.read')
  @Get()
  findAll(
    @Query() query: TimesheetQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.findAll(query, user);
  }

  @ApiOperation({ summary: 'Get timesheet details by ID' })
  @RequirePermissions('timesheets.read')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Submit weekly timesheet for approval' })
  @RequirePermissions('timesheets.submit')
  @Post(':id/submit')
  submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.submit(id, user);
  }

  @ApiOperation({ summary: 'Approve a submitted timesheet' })
  @RequirePermissions('timesheets.approve')
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.approve(id, user);
  }

  @ApiOperation({ summary: 'Reject a submitted timesheet with feedback' })
  @RequirePermissions('timesheets.reject')
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTimesheetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.reject(id, dto, user);
  }

  @ApiOperation({ summary: 'Lock an approved timesheet' })
  @RequirePermissions('timesheets.lock')
  @Post(':id/lock')
  lock(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timesheetsService.lock(id, user);
  }
}
