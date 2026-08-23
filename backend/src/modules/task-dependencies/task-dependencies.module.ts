import { Module } from '@nestjs/common';
import { TaskDependenciesController } from './task-dependencies.controller';
import { TaskDependenciesService } from './task-dependencies.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [TaskDependenciesController],
  providers: [TaskDependenciesService],
  exports: [TaskDependenciesService],
})
export class TaskDependenciesModule {}
