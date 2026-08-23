import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import {
  CreateClientPaymentDto,
  UpdateClientPaymentDto,
} from '../dto/client-payment.dto';
import { ClientPaymentsService } from '../services/client-payments.service';

@ApiTags('Client Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/payments')
export class ClientPaymentsController {
  constructor(private readonly clientPaymentsService: ClientPaymentsService) {}

  @Get()
  @RequirePermissions('finance.read')
  @ApiOperation({ summary: 'List client payments for a project' })
  getProjectPayments(@Param('projectId') projectId: string) {
    return this.clientPaymentsService.getProjectPayments(projectId);
  }

  @Post()
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Record a client payment with overpayment validation' })
  createPayment(
    @Param('projectId') projectId: string,
    @Body() dto: CreateClientPaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.clientPaymentsService.createPayment(projectId, dto, actorId);
  }

  @Patch(':paymentId')
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Update a recorded client payment' })
  updatePayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdateClientPaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.clientPaymentsService.updatePayment(
      projectId,
      paymentId,
      dto,
      actorId,
    );
  }

  @Delete(':paymentId')
  @RequirePermissions('finance.manage')
  @ApiOperation({ summary: 'Delete a client payment entry' })
  deletePayment(
    @Param('projectId') projectId: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.clientPaymentsService.deletePayment(
      projectId,
      paymentId,
      actorId,
    );
  }
}
