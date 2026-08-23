import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RisksService } from './risks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateRiskDto, RiskQueryDto, UpdateRiskDto } from './dto/risk.dto';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post('projects/:projectId/risks')
  @RequirePermissions('risks.create')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRiskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.create(projectId, dto, user);
  }

  @Get('projects/:projectId/risks')
  @RequirePermissions('risks.read')
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: RiskQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.findAll(projectId, query, user);
  }

  @Get('projects/:projectId/risks/matrix')
  @RequirePermissions('risks.read')
  getRiskMatrix(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.getRiskMatrix(projectId, user);
  }

  @Get('risks/:id')
  @RequirePermissions('risks.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.findOne(id, user);
  }

  @Patch('risks/:id')
  @RequirePermissions('risks.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRiskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.update(id, dto, user);
  }

  @Delete('risks/:id')
  @RequirePermissions('risks.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.risksService.remove(id, user);
  }
}
