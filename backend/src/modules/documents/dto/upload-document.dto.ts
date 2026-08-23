import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiPropertyOptional({ example: 'Architecture Blueprint v2' })
  @IsOptional()
  @IsString()
  displayName?: string;
}
