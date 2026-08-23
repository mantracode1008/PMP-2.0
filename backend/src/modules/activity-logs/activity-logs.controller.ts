import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogQueryDto } from './dto/log-query.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  @RequirePermissions('activity_logs.read')
  @ApiOperation({ summary: 'List system activity and audit logs' })
  findAll(@Query() query: ActivityLogQueryDto) {
    return this.activityLogsService.findAll(query);
  }
}
