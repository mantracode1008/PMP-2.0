import { Module } from '@nestjs/common';
import { ProjectArchiveService } from './project-archive.service';
import { ProjectArchiveController } from './project-archive.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [ProjectArchiveController],
  providers: [ProjectArchiveService],
  exports: [ProjectArchiveService],
})
export class ProjectArchiveModule {}
