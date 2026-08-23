import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApprovalEntityType, ApprovalStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ActionApprovalStepDto {
  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus; // APPROVED or REJECTED

  @IsString()
  @IsOptional()
  comments?: string;
}

export class ApprovalQueryDto extends PaginationQueryDto {
  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @IsEnum(ApprovalEntityType)
  @IsOptional()
  entityType?: ApprovalEntityType;

  @IsString()
  @IsOptional()
  projectId?: string;
}
