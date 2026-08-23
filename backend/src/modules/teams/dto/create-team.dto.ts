import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GeneralStatus, TeamMemberRole } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateTeamDto {
  @ApiProperty({ example: 'Platform Infrastructure Team' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Focuses on CI/CD, Kubernetes, and cloud security' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Team Lead User ID' })
  @IsOptional()
  @IsString()
  teamLeadId?: string;

  @ApiPropertyOptional({ enum: GeneralStatus, default: GeneralStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;

  @ApiPropertyOptional({ type: [String], description: 'Initial Member User IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ example: 'Platform Infrastructure Team' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Team Lead User ID' })
  @IsOptional()
  @IsString()
  teamLeadId?: string;

  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;
}

export class AddTeamMemberDto {
  @ApiProperty({ description: 'User ID to add to team' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: TeamMemberRole, default: TeamMemberRole.MEMBER })
  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;
}

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: TeamMemberRole })
  @IsNotEmpty()
  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;
}

export class TeamQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GeneralStatus })
  @IsOptional()
  @IsEnum(GeneralStatus)
  status?: GeneralStatus;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
