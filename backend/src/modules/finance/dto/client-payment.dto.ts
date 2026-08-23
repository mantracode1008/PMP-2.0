import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateClientPaymentDto {
  @ApiProperty({ description: 'Payment amount received from client', example: 10000 })
  @IsInt()
  @Min(1, { message: 'Amount must be greater than zero' })
  amount: number;

  @ApiPropertyOptional({ description: 'Date of payment', default: 'Now', example: '2026-08-23T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.UPI, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction reference or cheque number', example: 'UPI/2026/0823-9912' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes or remarks for the payment entry', example: 'Advance payment received' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateClientPaymentDto {
  @ApiPropertyOptional({ description: 'Payment amount received from client', example: 12000 })
  @IsInt()
  @Min(1, { message: 'Amount must be greater than zero' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Date of payment', example: '2026-08-23T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction reference or cheque number', example: 'UPI/2026/0823-9912' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Notes or remarks for the payment entry', example: 'Adjusted payment entry' })
  @IsString()
  @IsOptional()
  notes?: string;
}
