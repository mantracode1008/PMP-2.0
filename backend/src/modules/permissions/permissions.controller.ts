import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions.read')
  @ApiOperation({ summary: 'Get all available system permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @RequirePermissions('permissions.read')
  @ApiOperation({ summary: 'Get permissions grouped by domain module' })
  findGrouped() {
    return this.permissionsService.findByModule();
  }
}
