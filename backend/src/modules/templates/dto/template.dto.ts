import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateTaskTemplateItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  defaultRole?: string; // e.g. "DEVELOPER", "DESIGNER", "QA", "PROJECT_MANAGER"

  @IsInt()
  @IsOptional()
  orderIndex?: number = 0;

  @IsInt()
  @IsOptional()
  targetDayOffset?: number = 0;

  @IsArray()
  @IsOptional()
  checklist?: string[];
}

export class CreateMilestoneTemplateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number = 0;

  @IsInt()
  @IsOptional()
  targetDayOffset?: number = 0;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskTemplateItemDto)
  tasks?: CreateTaskTemplateItemDto[];
}

export class CreateProjectTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  estimatedDurationDays?: number = 30;

  @IsArray()
  @IsOptional()
  defaultRoles?: string[] = ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA'];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneTemplateItemDto)
  milestones?: CreateMilestoneTemplateItemDto[];
}

export class UpdateProjectTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  estimatedDurationDays?: number;

  @IsArray()
  @IsOptional()
  defaultRoles?: string[];
}

export class InstantiateProjectTemplateDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g. PRJ-101

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsObject()
  @IsOptional()
  roleMappings?: Record<string, string>; // e.g. { "DEVELOPER": "user-cuid-1", "DESIGNER": "user-cuid-2" }
}

export class CreateTaskTemplateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority = TaskPriority.MEDIUM;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsString()
  @IsOptional()
  defaultRole?: string;

  @IsArray()
  @IsOptional()
  checklist?: string[];

  @IsBoolean()
  @IsOptional()
  isStandalone?: boolean = true;
}

export class TemplateQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  category?: string;
}
