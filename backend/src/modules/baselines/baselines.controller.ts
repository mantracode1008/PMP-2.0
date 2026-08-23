import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BaselinesService } from './baselines.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { BaselineQueryDto, CreateBaselineDto } from './dto/baseline.dto';

@Controller('projects/:projectId/baselines')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BaselinesController {
  constructor(private readonly baselinesService: BaselinesService) {}

  @Post()
  @RequirePermissions('baselines.create')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBaselineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.baselinesService.create(projectId, dto, user);
  }

  @Get()
  @RequirePermissions('baselines.read')
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: BaselineQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.baselinesService.findAll(projectId, query, user);
  }

  @Get(':id')
  @RequirePermissions('baselines.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.baselinesService.findOne(id, user);
  }

  @Get(':id/compare')
  @RequirePermissions('baselines.read')
  compareBaseline(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.baselinesService.compareBaseline(projectId, id, user);
  }
}
