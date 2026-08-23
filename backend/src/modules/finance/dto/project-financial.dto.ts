import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SetProjectFinancialDto {
  @ApiProperty({ description: 'Total financial / contract value of the project', example: 50000 })
  @IsInt()
  @Min(0, { message: 'Project value must be a non-negative integer' })
  projectValue: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR', example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateProjectFinancialDto {
  @ApiPropertyOptional({ description: 'Total financial / contract value of the project', example: 60000 })
  @IsInt()
  @Min(0, { message: 'Project value must be a non-negative integer' })
  @IsOptional()
  projectValue?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;
}
