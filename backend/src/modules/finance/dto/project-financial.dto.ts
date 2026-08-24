import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SetProjectFinancialDto {
  @ApiProperty({ description: 'Total financial / contract value of the project', example: 50000 })
  @IsInt()
  @Min(0, { message: 'Project value must be a non-negative integer' })
  projectValue: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR', example: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Expected date of next client payment', example: '2026-09-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  nextPaymentDueDate?: Date | null;

  @ApiPropertyOptional({ description: 'Expected amount for next client payment', example: 25000 })
  @IsInt()
  @Min(1, { message: 'Next payment amount must be greater than zero' })
  @IsOptional()
  nextPaymentAmount?: number | null;

  @ApiPropertyOptional({ description: 'Notes or milestones for the upcoming payment', example: '50% on milestone 2 delivery' })
  @IsString()
  @IsOptional()
  paymentReminderNotes?: string | null;
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

  @ApiPropertyOptional({ description: 'Expected date of next client payment', example: '2026-09-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  nextPaymentDueDate?: Date | null;

  @ApiPropertyOptional({ description: 'Expected amount for next client payment', example: 25000 })
  @IsInt()
  @Min(1, { message: 'Next payment amount must be greater than zero' })
  @IsOptional()
  nextPaymentAmount?: number | null;

  @ApiPropertyOptional({ description: 'Notes or milestones for the upcoming payment', example: '50% on milestone 2 delivery' })
  @IsString()
  @IsOptional()
  paymentReminderNotes?: string | null;
}
