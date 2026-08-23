import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { RiskCategory, RiskImpact, RiskProbability, RiskStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export const PROBABILITY_WEIGHT: Record<RiskProbability, number> = {
  [RiskProbability.LOW]: 1,
  [RiskProbability.MEDIUM]: 2,
  [RiskProbability.HIGH]: 3,
  [RiskProbability.VERY_HIGH]: 4,
};

export const IMPACT_WEIGHT: Record<RiskImpact, number> = {
  [RiskImpact.LOW]: 1,
  [RiskImpact.MEDIUM]: 2,
  [RiskImpact.HIGH]: 3,
  [RiskImpact.CRITICAL]: 4,
};

export function calculateRiskScore(probability: RiskProbability, impact: RiskImpact): number {
  const pWeight = PROBABILITY_WEIGHT[probability] || 1;
  const iWeight = IMPACT_WEIGHT[impact] || 1;
  return pWeight * iWeight;
}

export class CreateRiskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RiskCategory)
  @IsOptional()
  category?: RiskCategory = RiskCategory.TECHNICAL;

  @IsEnum(RiskProbability)
  @IsNotEmpty()
  probability: RiskProbability;

  @IsEnum(RiskImpact)
  @IsNotEmpty()
  impact: RiskImpact;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsDateString()
  @IsOptional()
  identifiedDate?: string;

  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @IsString()
  @IsOptional()
  mitigationPlan?: string;

  @IsString()
  @IsOptional()
  contingencyPlan?: string;
}

export class UpdateRiskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RiskCategory)
  @IsOptional()
  category?: RiskCategory;

  @IsEnum(RiskStatus)
  @IsOptional()
  status?: RiskStatus;

  @IsEnum(RiskProbability)
  @IsOptional()
  probability?: RiskProbability;

  @IsEnum(RiskImpact)
  @IsOptional()
  impact?: RiskImpact;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsDateString()
  @IsOptional()
  identifiedDate?: string;

  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @IsString()
  @IsOptional()
  mitigationPlan?: string;

  @IsString()
  @IsOptional()
  contingencyPlan?: string;
}

export class RiskQueryDto extends PaginationQueryDto {
  @IsEnum(RiskStatus)
  @IsOptional()
  status?: RiskStatus;

  @IsEnum(RiskCategory)
  @IsOptional()
  category?: RiskCategory;

  @IsEnum(RiskProbability)
  @IsOptional()
  probability?: RiskProbability;

  @IsEnum(RiskImpact)
  @IsOptional()
  impact?: RiskImpact;

  @IsString()
  @IsOptional()
  ownerId?: string;
}
