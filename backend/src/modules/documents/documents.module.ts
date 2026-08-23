import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LocalStorageService } from './storage/local-storage.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, LocalStorageService],
  exports: [DocumentsService, LocalStorageService],
})
export class DocumentsModule {}
