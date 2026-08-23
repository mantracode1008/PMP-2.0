import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  AddProjectMemberDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
  UpdateProjectMemberDto,
} from './dto/create-project.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('metrics')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get project metrics scoped to user permission' })
  getMetrics(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getMetrics(user);
  }

  @Get()
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'List projects with filters, pagination, and scoping' })
  findAll(@Query() query: ProjectQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Get project details, client, owner, and members' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('projects.create')
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('projects.update')
  @ApiOperation({ summary: 'Update project information' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(id, dto, user);
  }

  @Post(':id/members')
  @RequirePermissions('projects.manage_members')
  @ApiOperation({ summary: 'Add a member to a project' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.addMember(id, dto, user);
  }

  @Put(':id/members/:userId')
  @RequirePermissions('projects.manage_members')
  @ApiOperation({ summary: 'Update project member role (MANAGER, MEMBER, VIEWER)' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.updateMemberRole(id, userId, dto, user);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('projects.manage_members')
  @ApiOperation({ summary: 'Remove a member from a project' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.removeMember(id, userId, user);
  }

  @Delete(':id')
  @RequirePermissions('projects.delete')
  @ApiOperation({ summary: 'Archive a project' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.remove(id, user);
  }
}
