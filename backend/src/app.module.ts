import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MilestonesModule } from './modules/milestones/milestones.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskDependenciesModule } from './modules/task-dependencies/task-dependencies.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MyWorkModule } from './modules/my-work/my-work.module';
import { WorkLogsModule } from './modules/worklogs/worklogs.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { WorkloadModule } from './modules/workload/workload.module';
import { ProjectPlanningModule } from './modules/project-planning/project-planning.module';
import { HealthModule } from './modules/health/health.module';
import { RisksModule } from './modules/risks/risks.module';
import { IssuesModule } from './modules/issues/issues.module';
import { ProjectHealthModule } from './modules/project-health/project-health.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { ChangeRequestsModule } from './modules/change-requests/change-requests.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { RecurringTasksModule } from './modules/recurring-tasks/recurring-tasks.module';
import { BaselinesModule } from './modules/baselines/baselines.module';
import { ProjectArchiveModule } from './modules/project-archive/project-archive.module';
import { FinanceModule } from './modules/finance/finance.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    ActivityLogsModule,
    PermissionsModule,
    RolesModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    TeamsModule,
    ClientsModule,
    ProjectsModule,
    MilestonesModule,
    TasksModule,
    TaskDependenciesModule,
    CommentsModule,
    DocumentsModule,
    MyWorkModule,
    WorkLogsModule,
    TimesheetsModule,
    WorkloadModule,
    ProjectPlanningModule,
    HealthModule,
    RisksModule,
    IssuesModule,
    ProjectHealthModule,
    ApprovalsModule,
    ChangeRequestsModule,
    TemplatesModule,
    RecurringTasksModule,
    BaselinesModule,
    ProjectArchiveModule,
    FinanceModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
