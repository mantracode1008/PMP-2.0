import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ChangeRequestStatus, ChangeRequestType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateChangeRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ChangeRequestType)
  @IsOptional()
  type?: ChangeRequestType = ChangeRequestType.SCOPE;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  impactSummary?: string;

  @IsInt()
  @IsOptional()
  scheduleImpactDays?: number;

  @IsString()
  @IsOptional()
  costImpact?: string;

  @IsString()
  @IsOptional()
  resourceImpact?: string;

  @IsString()
  @IsOptional()
  scopeImpact?: string;

  @IsString()
  @IsOptional()
  riskImpact?: string;
}

export class UpdateChangeRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ChangeRequestType)
  @IsOptional()
  type?: ChangeRequestType;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  impactSummary?: string;

  @IsInt()
  @IsOptional()
  scheduleImpactDays?: number;

  @IsString()
  @IsOptional()
  costImpact?: string;

  @IsString()
  @IsOptional()
  resourceImpact?: string;

  @IsString()
  @IsOptional()
  scopeImpact?: string;

  @IsString()
  @IsOptional()
  riskImpact?: string;
}

export class ChangeRequestQueryDto extends PaginationQueryDto {
  @IsEnum(ChangeRequestStatus)
  @IsOptional()
  status?: ChangeRequestStatus;

  @IsEnum(ChangeRequestType)
  @IsOptional()
  type?: ChangeRequestType;

  @IsString()
  @IsOptional()
  requestedById?: string;
}
