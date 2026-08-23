import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProjectHealth, ProjectMemberRole, ProjectStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateProjectDto {
  @ApiPropertyOptional({ example: 'PRJ-003', description: 'Auto-generated if omitted' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'Mobile Banking Experience 2.0' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Complete rewrite of mobile onboarding and biometric authentication.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth, default: ProjectHealth.HEALTHY })
  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;

  @ApiProperty({ description: 'Client ID' })
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'Project Owner User ID (defaults to creator if omitted)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ type: [String], description: 'User IDs to add as initial members' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Mobile Banking Experience 2.0' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth })
  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;

  @ApiPropertyOptional({ description: 'Client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Owner User ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  actualEndDate?: string;
}

export class AddProjectMemberDto {
  @ApiProperty({ description: 'User ID to add as project member' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: ProjectMemberRole, default: ProjectMemberRole.MEMBER })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  projectRole?: ProjectMemberRole;
}

export class UpdateProjectMemberDto {
  @ApiProperty({ enum: ProjectMemberRole })
  @IsNotEmpty()
  @IsEnum(ProjectMemberRole)
  projectRole: ProjectMemberRole;
}

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth })
  @IsOptional()
  @IsEnum(ProjectHealth)
  health?: ProjectHealth;

  @ApiPropertyOptional({ description: 'Filter by Client ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Filter by Owner ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
