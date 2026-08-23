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
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  CreateIssueDto,
  IssueQueryDto,
  ResolveIssueDto,
  UpdateIssueDto,
} from './dto/issue.dto';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post('projects/:projectId/issues')
  @RequirePermissions('issues.create')
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.create(projectId, dto, user);
  }

  @Get('projects/:projectId/issues')
  @RequirePermissions('issues.read')
  findAll(
    @Param('projectId') projectId: string,
    @Query() query: IssueQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.findAll(projectId, query, user);
  }

  @Get('issues/:id')
  @RequirePermissions('issues.read')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.findOne(id, user);
  }

  @Patch('issues/:id')
  @RequirePermissions('issues.update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.update(id, dto, user);
  }

  @Post('issues/:id/resolve')
  @RequirePermissions('issues.update')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.resolve(id, dto, user);
  }

  @Delete('issues/:id')
  @RequirePermissions('issues.delete')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.issuesService.remove(id, user);
  }
}
