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
import { ClientsService } from './clients.service';
import {
  ClientQueryDto,
  CreateClientDto,
  UpdateClientDto,
} from './dto/create-client.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('metrics')
  @RequirePermissions('clients.read')
  @ApiOperation({ summary: 'Get client metrics' })
  getMetrics() {
    return this.clientsService.getMetrics();
  }

  @Get()
  @RequirePermissions('clients.read')
  @ApiOperation({ summary: 'List clients with pagination, filters, and search' })
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  @ApiOperation({ summary: 'Get client details and associated projects' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermissions('clients.create')
  @ApiOperation({ summary: 'Create a new client' })
  create(@Body() dto: CreateClientDto, @CurrentUser('id') actorId: string) {
    return this.clientsService.create(dto, actorId);
  }

  @Patch(':id')
  @RequirePermissions('clients.update')
  @ApiOperation({ summary: 'Update client details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.clientsService.update(id, dto, actorId);
  }

  @Delete(':id')
  @RequirePermissions('clients.delete')
  @ApiOperation({ summary: 'Archive a client' })
  remove(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.clientsService.remove(id, actorId);
  }
}
