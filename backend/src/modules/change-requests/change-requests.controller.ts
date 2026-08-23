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
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  ChangeRequestQueryDto,
  CreateChangeRequestDto,
  UpdateChangeRequestDto,
} from './dto/change-request.dto';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post('projects/:projectId/change-requests')
  @RequirePermissions('change_requests.create')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.create(projectId, dto, user);
  }

  @Get('projects/:projectId/change-requests')
  @RequirePermissions('change_requests.read')
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: ChangeRequestQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.findAll(projectId, query, user);
  }

  @Get('change-requests/:id')
  @RequirePermissions('change_requests.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.findOne(id, user);
  }

  @Patch('change-requests/:id')
  @RequirePermissions('change_requests.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChangeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.update(id, dto, user);
  }

  @Post('change-requests/:id/submit')
  @RequirePermissions('change_requests.submit')
  submit(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.submit(id, user);
  }

  @Post('change-requests/:id/implement')
  @RequirePermissions('change_requests.approve')
  implement(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.implement(id, user);
  }

  @Delete('change-requests/:id')
  @RequirePermissions('change_requests.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.changeRequestsService.remove(id, user);
  }
}
