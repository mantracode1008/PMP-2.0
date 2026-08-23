import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneQueryDto } from './dto/milestone-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Milestones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @ApiOperation({ summary: 'List milestones for a project' })
  @RequirePermissions('milestones.read')
  @Get('projects/:projectId/milestones')
  findAllByProject(
    @Param('projectId') projectId: string,
    @Query() query: MilestoneQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.findAllByProject(projectId, query, user);
  }

  @ApiOperation({ summary: 'Create milestone for a project' })
  @RequirePermissions('milestones.create')
  @Post('projects/:projectId/milestones')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.create(projectId, dto, user);
  }

  @ApiOperation({ summary: 'Get milestone details by ID' })
  @RequirePermissions('milestones.read')
  @Get('milestones/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.milestonesService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Update milestone' })
  @RequirePermissions('milestones.update')
  @Patch('milestones/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMilestoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.milestonesService.update(id, dto, user);
  }

  @ApiOperation({ summary: 'Archive milestone' })
  @RequirePermissions('milestones.delete')
  @Delete('milestones/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.milestonesService.remove(id, user);
  }
}
