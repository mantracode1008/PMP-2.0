import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClosureValidationPolicy } from '@prisma/client';

export class ArchiveProjectDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(ClosureValidationPolicy)
  @IsOptional()
  policy?: ClosureValidationPolicy = ClosureValidationPolicy.WARN;
}

export interface ProjectClosureCheckResult {
  projectId: string;
  projectName: string;
  canArchive: boolean;
  blockersCount: number;
  warningsCount: number;
  checks: {
    uncompletedTasks: { passed: boolean; count: number; items: { id: string; title: string; status: string }[] };
    criticalIssues: { passed: boolean; count: number; items: { id: string; title: string; severity: string }[] };
    pendingApprovals: { passed: boolean; count: number; items: { id: string; entityType: string; status: string }[] };
    openHighRisks: { passed: boolean; count: number; items: { id: string; title: string; score: number }[] };
    unsubmittedTimesheets: { passed: boolean; count: number; items: { id: string; user: string; status: string }[] };
  };
}
