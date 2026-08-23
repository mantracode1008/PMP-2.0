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
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './dto/create-user.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('metrics')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get high-level user count metrics' })
  getMetrics() {
    return this.usersService.getMetrics();
  }

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List users with pagination, filters, and search' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get user details by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a new user with role and department assignment' })
  create(@Body() dto: CreateUserDto, @CurrentUser('id') actorId: string) {
    return this.usersService.create(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update user profile and details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.update(id, dto, actorId);
  }

  @Put(':id/status')
  @RequirePermissions('users.manage_status')
  @ApiOperation({ summary: 'Update user lifecycle status (ACTIVE, INACTIVE, SUSPENDED)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.updateStatus(id, dto, actorId);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @ApiOperation({ summary: 'Soft-delete and archive user account' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.usersService.remove(id, actorId);
  }
}
