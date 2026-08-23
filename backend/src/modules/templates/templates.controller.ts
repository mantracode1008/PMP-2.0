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
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import {
  CreateProjectTemplateDto,
  CreateTaskTemplateDto,
  InstantiateProjectTemplateDto,
  TemplateQueryDto,
  UpdateProjectTemplateDto,
} from './dto/template.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('projects')
  @RequirePermissions('templates.create')
  createProjectTemplate(
    @Body() dto: CreateProjectTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.createProjectTemplate(dto, user);
  }

  @Get('projects')
  @RequirePermissions('templates.read')
  findAllProjectTemplates(@Query() query: TemplateQueryDto) {
    return this.templatesService.findAllProjectTemplates(query);
  }

  @Get('projects/:id')
  @RequirePermissions('templates.read')
  findOneProjectTemplate(@Param('id') id: string) {
    return this.templatesService.findOneProjectTemplate(id);
  }

  @Patch('projects/:id')
  @RequirePermissions('templates.update')
  updateProjectTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateProjectTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.updateProjectTemplate(id, dto, user);
  }

  @Delete('projects/:id')
  @RequirePermissions('templates.delete')
  removeProjectTemplate(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.removeProjectTemplate(id, user);
  }

  @Post('projects/:id/instantiate')
  @RequirePermissions('templates.instantiate')
  instantiateTemplate(
    @Param('id') id: string,
    @Body() dto: InstantiateProjectTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.instantiateTemplate(id, dto, user);
  }

  @Post('tasks')
  @RequirePermissions('templates.create')
  createTaskTemplate(
    @Body() dto: CreateTaskTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.createTaskTemplate(dto, user);
  }

  @Get('tasks')
  @RequirePermissions('templates.read')
  findAllTaskTemplates() {
    return this.templatesService.findAllTaskTemplates();
  }
}
