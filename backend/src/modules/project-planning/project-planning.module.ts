import { Module } from '@nestjs/common';
import { ProjectPlanningController } from './project-planning.controller';
import { ProjectPlanningService } from './project-planning.service';

@Module({
  controllers: [ProjectPlanningController],
  providers: [ProjectPlanningService],
  exports: [ProjectPlanningService],
})
export class ProjectPlanningModule {}
