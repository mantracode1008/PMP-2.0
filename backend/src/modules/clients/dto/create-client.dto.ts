import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GeneralStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateClientDto {
  @ApiProperty({ example: 'Acme Global Services' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ example: 'contact@acmecorp.com' })
  @IsEmail({}, { message: 'Please provide a valid client contact email.' })
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1 (800) 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acmecorp.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: '100 Enterprise Way, Suite 400, San Francisco, CA' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: GeneralStatus, default: GeneralStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}

export class UpdateClientDto {
  @ApiPropertyOptional({ example: 'Acme Global Services' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'contact@acmecorp.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1 (800) 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://acmecorp.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: '100 Enterprise Way, Suite 400, San Francisco, CA' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}

export class ClientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}
