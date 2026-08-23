import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GeneralStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Quality Assurance' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Software testing and quality compliance' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GeneralStatus, default: GeneralStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'Quality Assurance & Security' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'QA, automation, and vulnerability scanning' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}

export class DepartmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}
