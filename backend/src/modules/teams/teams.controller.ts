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
import { TeamsService } from './teams.service';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  TeamQueryDto,
  UpdateTeamDto,
  UpdateTeamMemberDto,
} from './dto/create-team.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @RequirePermissions('teams.read')
  @ApiOperation({ summary: 'List teams with member count, filters and pagination' })
  findAll(@Query() query: TeamQueryDto) {
    return this.teamsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('teams.read')
  @ApiOperation({ summary: 'Get team details and member roster' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post()
  @RequirePermissions('teams.create')
  @ApiOperation({ summary: 'Create a new team' })
  create(@Body() dto: CreateTeamDto, @CurrentUser('id') actorId: string) {
    return this.teamsService.create(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions('teams.update')
  @ApiOperation({ summary: 'Update team information' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.teamsService.update(id, dto, actorId);
  }

  @Post(':id/members')
  @RequirePermissions('teams.update')
  @ApiOperation({ summary: 'Add a user to a team' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.teamsService.addMember(id, dto, actorId);
  }

  @Put(':id/members/:userId')
  @RequirePermissions('teams.update')
  @ApiOperation({ summary: 'Update a team member role (LEAD, MEMBER, CONTRIBUTOR)' })
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.teamsService.updateMember(id, userId, dto, actorId);
  }

  @Delete(':id/members/:userId')
  @RequirePermissions('teams.update')
  @ApiOperation({ summary: 'Remove a member from a team' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.teamsService.removeMember(id, userId, actorId);
  }

  @Delete(':id')
  @RequirePermissions('teams.delete')
  @ApiOperation({ summary: 'Archive a team' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.teamsService.remove(id, actorId);
  }
}
