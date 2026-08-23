import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class MilestoneQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MilestoneStatus })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
