import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateCapacityDto {
  @ApiPropertyOptional({ description: 'Daily capacity in minutes', example: 480 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(60)
  @Max(1440)
  dailyCapacityMinutes?: number;

  @ApiPropertyOptional({ description: 'Weekly capacity in minutes', example: 2400 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(60)
  @Max(10080)
  weeklyCapacityMinutes?: number;

  @ApiPropertyOptional({ description: 'Working days of the week (1=Mon ... 7=Sun)', example: [1, 2, 3, 4, 5] })
  @IsOptional()
  @IsArray()
  workingDays?: number[];
}

export class WorkloadQueryDto {
  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by team ID' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Search users by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date for actual logged hours calculation' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for actual logged hours calculation' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit number of records', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Filter by workload status' })
  @IsOptional()
  @IsString()
  status?: string;
}

