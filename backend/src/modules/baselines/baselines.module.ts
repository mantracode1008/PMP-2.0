import { Module } from '@nestjs/common';
import { BaselinesService } from './baselines.service';
import { BaselinesController } from './baselines.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [BaselinesController],
  providers: [BaselinesService],
  exports: [BaselinesService],
})
export class BaselinesModule {}
