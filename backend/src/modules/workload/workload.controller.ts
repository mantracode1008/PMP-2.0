import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkloadService } from './workload.service';
import { UpdateCapacityDto, WorkloadQueryDto } from './dto/workload.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Workload & Capacity')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) {}

  @ApiOperation({ summary: 'Get team workload, utilization, and capacity status' })
  @RequirePermissions('workload.read')
  @Get('workload')
  getTeamWorkload(
    @Query() query: WorkloadQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workloadService.getTeamWorkload(query, user);
  }

  @ApiOperation({ summary: 'Get user capacity configuration' })
  @Get('capacity/:userId')
  getUserCapacity(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workloadService.getUserCapacity(userId, user);
  }

  @ApiOperation({ summary: 'Configure user working hours and schedule capacity' })
  @RequirePermissions('users.update')
  @Put('capacity/:userId')
  updateUserCapacity(
    @Param('userId') userId: string,
    @Body() dto: UpdateCapacityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workloadService.updateUserCapacity(userId, dto, user);
  }
}
