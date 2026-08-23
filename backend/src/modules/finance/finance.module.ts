import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FinanceController } from './controllers/finance.controller';
import { ProjectFinancialsController } from './controllers/project-financials.controller';
import { ClientPaymentsController } from './controllers/client-payments.controller';
import { ProjectExpensesController } from './controllers/project-expenses.controller';
import { FinanceDashboardService } from './services/finance-dashboard.service';
import { ProjectFinancialsService } from './services/project-financials.service';
import { ClientPaymentsService } from './services/client-payments.service';
import { ProjectExpensesService } from './services/project-expenses.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    FinanceController,
    ProjectFinancialsController,
    ClientPaymentsController,
    ProjectExpensesController,
  ],
  providers: [
    FinanceDashboardService,
    ProjectFinancialsService,
    ClientPaymentsService,
    ProjectExpensesService,
  ],
  exports: [
    FinanceDashboardService,
    ProjectFinancialsService,
    ClientPaymentsService,
    ProjectExpensesService,
  ],
})
export class FinanceModule {}
