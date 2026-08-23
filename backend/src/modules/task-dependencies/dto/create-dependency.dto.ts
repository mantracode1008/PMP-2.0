import { IsNotEmpty, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DependencyType } from '@prisma/client';

export class CreateDependencyDto {
  @ApiProperty({ example: 'depends-on-task-id-uuid' })
  @IsNotEmpty()
  @IsString()
  dependsOnTaskId: string;

  @ApiProperty({ enum: DependencyType, default: DependencyType.DEPENDS_ON, required: false })
  @IsOptional()
  @IsEnum(DependencyType)
  dependencyType?: DependencyType;
}
