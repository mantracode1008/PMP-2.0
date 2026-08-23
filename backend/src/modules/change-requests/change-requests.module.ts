import { Module } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { ChangeRequestsController } from './change-requests.controller';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [ActivityLogsModule, ApprovalsModule],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
