import { Module } from '@nestjs/common';
import { WorkLogsController } from './worklogs.controller';
import { WorkLogsService } from './worklogs.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [WorkLogsController],
  providers: [WorkLogsService],
  exports: [WorkLogsService],
})
export class WorkLogsModule {}
