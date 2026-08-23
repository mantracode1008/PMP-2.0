import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  DepartmentQueryDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('departments.read')
  @ApiOperation({ summary: 'List all departments with pagination and search' })
  findAll(@Query() query: DepartmentQueryDto) {
    return this.departmentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('departments.read')
  @ApiOperation({ summary: 'Get department details and members' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @RequirePermissions('departments.create')
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser('id') actorId: string) {
    return this.departmentsService.create(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions('departments.update')
  @ApiOperation({ summary: 'Update department information' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.departmentsService.update(id, dto, actorId);
  }

  @Delete(':id')
  @RequirePermissions('departments.delete')
  @ApiOperation({ summary: 'Archive a department' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.departmentsService.remove(id, actorId);
  }
}
