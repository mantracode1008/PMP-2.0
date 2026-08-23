import { Module } from '@nestjs/common';
import { ProjectHealthService } from './project-health.service';
import { ProjectHealthController } from './project-health.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [ProjectHealthController],
  providers: [ProjectHealthService],
  exports: [ProjectHealthService],
})
export class ProjectHealthModule {}
