import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ActionApprovalStepDto, ApprovalQueryDto } from './dto/approval.dto';

@Controller('approvals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @RequirePermissions('change_requests.read')
  findAll(
    @Query() query: ApprovalQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approvalsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('change_requests.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approvalsService.findOne(id, user);
  }

  @Post(':id/steps/:stepId/action')
  @RequirePermissions('change_requests.approve')
  actionStep(
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: ActionApprovalStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approvalsService.actionStep(id, stepId, dto, user);
  }
}
