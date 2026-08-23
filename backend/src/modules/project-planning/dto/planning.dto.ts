import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CalendarQueryDto {
  @ApiPropertyOptional({ description: 'Start date of calendar window (ISO string)', example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date of calendar window (ISO string)', example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by assignee user ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filter by milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;
}

export class DeadlineQueryDto {
  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by assignee ID' })
  @IsOptional()
  @IsString()
  assigneeId?: string;
}
