import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DependencyType } from '@prisma/client';

export class CreateDependencyDto {
  @ApiProperty({ example: 'depends-on-task-id-uuid' })
  @IsNotEmpty()
  @IsString()
  dependsOnTaskId: string;

  @ApiProperty({ enum: DependencyType, default: DependencyType.DEPENDS_ON })
  @IsNotEmpty()
  @IsEnum(DependencyType)
  dependencyType: DependencyType;
}
