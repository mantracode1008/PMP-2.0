import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TimesheetStatus } from '@prisma/client';

export class RejectTimesheetDto {
  @ApiProperty({ description: 'Reason for rejecting timesheet submission', example: 'Missing work log for Wednesday client review meeting' })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  rejectionReason: string;
}

export class TimesheetQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: TimesheetStatus, description: 'Filter by timesheet status' })
  @IsOptional()
  @IsEnum(TimesheetStatus)
  status?: TimesheetStatus;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
