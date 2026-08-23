import { Module } from '@nestjs/common';
import { WorkloadController } from './workload.controller';
import { WorkloadService } from './workload.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [WorkloadController],
  providers: [WorkloadService],
  exports: [WorkloadService],
})
export class WorkloadModule {}
