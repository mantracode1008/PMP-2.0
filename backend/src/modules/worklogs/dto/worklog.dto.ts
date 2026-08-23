import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorkLogDto {
  @ApiProperty({ description: 'Date of work log (ISO 8601 string)', example: '2026-03-24' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Duration in minutes (e.g., 90 for 1h 30m)', example: 90 })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Description of the work performed', example: 'Investigated and resolved database connection timeout' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the work is billable', default: true })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;
}

export class UpdateWorkLogDto {
  @ApiPropertyOptional({ description: 'Date of work log', example: '2026-03-24' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 120 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'Description of the work performed' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the work is billable' })
  @IsOptional()
  @IsBoolean()
  billable?: boolean;
}

export class WorkLogQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by task ID' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}
