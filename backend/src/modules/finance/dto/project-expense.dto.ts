import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
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

export class CreateProjectExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.DEVELOPER_PAYMENT })
  @IsEnum(ExpenseCategory)
  @IsNotEmpty()
  category: ExpenseCategory;

  @ApiPropertyOptional({ description: 'User / Team Member ID if expense is a team/contractor payment' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Expense amount in integer units', example: 5000 })
  @IsInt()
  @Min(1, { message: 'Amount must be greater than zero' })
  amount: number;

  @ApiPropertyOptional({ description: 'Payment date of expense', default: 'Now' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction reference or invoice number', example: 'REF-EXP-9921' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiProperty({ description: 'Description or purpose of the expense', example: 'Frontend development payment' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Receipt or voucher attachment URL' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class UpdateProjectExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory, example: ExpenseCategory.DEVELOPER_PAYMENT })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'User / Team Member ID if expense is a team/contractor payment' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Expense amount in integer units', example: 5000 })
  @IsInt()
  @Min(1, { message: 'Amount must be greater than zero' })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Payment date of expense' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction reference or invoice number', example: 'REF-EXP-9921' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Description or purpose of the expense', example: 'Frontend development payment' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Receipt or voucher attachment URL' })
  @IsString()
  @IsOptional()
  receiptUrl?: string;
}

export class ProjectExpenseQueryDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @ApiPropertyOptional({ description: 'Filter by recipient team member / user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date filter' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}
