import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectHealth } from '@prisma/client';

export class OverrideHealthDto {
  @IsEnum(ProjectHealth)
  @IsNotEmpty()
  health: ProjectHealth;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export interface HealthDimension {
  status: ProjectHealth;
  score: number; // 0 (healthy), 1 (at risk), 2 (critical)
  summary: string;
  details: Record<string, any>;
}

export interface ProjectHealthReport {
  projectId: string;
  projectName: string;
  projectCode: string;
  overallHealth: ProjectHealth;
  calculatedHealth: ProjectHealth;
  isOverridden: boolean;
  overrideDetails?: {
    reason: string | null;
    overriddenBy: { id: string; firstName: string; lastName: string } | null;
    overriddenAt: Date | null;
  };
  dimensions: {
    schedule: HealthDimension;
    scope: HealthDimension;
    resources: HealthDimension;
    risks: HealthDimension;
    issues: HealthDimension;
  };
  calculatedAt: Date;
}
