import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto/create-role.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Get all roles and their assigned permissions' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('roles.read')
  @ApiOperation({ summary: 'Get role details by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Create a custom role with permissions' })
  create(@Body() dto: CreateRoleDto, @CurrentUser('id') actorId: string) {
    return this.rolesService.create(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Update role details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.rolesService.update(id, dto, actorId);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles.manage')
  @ApiOperation({ summary: 'Update permissions for a specific role' })
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.rolesService.updatePermissions(id, dto, actorId);
  }
}
