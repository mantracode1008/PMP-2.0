import { IsNotEmpty, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {
  @ApiProperty({ type: [String], example: ['user-id-1'] })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
