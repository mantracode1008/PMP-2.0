import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'PROJECT_MANAGER' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Project Manager' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Can manage projects and project members' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'List of permission IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Senior Project Manager' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Manages multi-tier projects' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], description: 'List of permission IDs to associate with this role' })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
