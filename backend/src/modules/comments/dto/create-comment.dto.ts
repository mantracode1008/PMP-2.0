import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Hey @John, please review the revised SSL parameters.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String], example: ['user-id-1'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];
}
