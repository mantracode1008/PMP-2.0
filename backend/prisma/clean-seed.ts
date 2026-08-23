import { PrismaClient, GeneralStatus, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Users
  { code: 'users.create', module: 'users', action: 'create', description: 'Create new users' },
  { code: 'users.read', module: 'users', action: 'read', description: 'View user profiles and list' },
  { code: 'users.update', module: 'users', action: 'update', description: 'Edit user information' },
  { code: 'users.delete', module: 'users', action: 'delete', description: 'Archive or remove users' },
  { code: 'users.manage_status', module: 'users', action: 'manage_status', description: 'Activate, deactivate, suspend users' },

  // Roles & Permissions
  { code: 'roles.read', module: 'roles', action: 'read', description: 'View system roles and assignments' },
  { code: 'roles.manage', module: 'roles', action: 'manage', description: 'Manage roles and assign permissions' },
  { code: 'permissions.read', module: 'permissions', action: 'read', description: 'View all system permissions' },

  // Departments
  { code: 'departments.create', module: 'departments', action: 'create', description: 'Create new departments' },
  { code: 'departments.read', module: 'departments', action: 'read', description: 'View departments list and details' },
  { code: 'departments.update', module: 'departments', action: 'update', description: 'Edit department information' },
  { code: 'departments.delete', module: 'departments', action: 'delete', description: 'Archive or remove departments' },

  // Teams
  { code: 'teams.create', module: 'teams', action: 'create', description: 'Create new teams' },
  { code: 'teams.read', module: 'teams', action: 'read', description: 'View teams and rosters' },
  { code: 'teams.update', module: 'teams', action: 'update', description: 'Edit team settings and members' },
  { code: 'teams.delete', module: 'teams', action: 'delete', description: 'Archive or remove teams' },

  // Clients
  { code: 'clients.create', module: 'clients', action: 'create', description: 'Create new clients' },
  { code: 'clients.read', module: 'clients', action: 'read', description: 'View client directory and details' },
  { code: 'clients.update', module: 'clients', action: 'update', description: 'Edit client information' },
  { code: 'clients.delete', module: 'clients', action: 'delete', description: 'Archive or remove clients' },

  // Projects
  { code: 'projects.create', module: 'projects', action: 'create', description: 'Create new projects' },
  { code: 'projects.read', module: 'projects', action: 'read', description: 'View projects list and overview' },
  { code: 'projects.update', module: 'projects', action: 'update', description: 'Edit project details, status, health' },
  { code: 'projects.delete', module: 'projects', action: 'delete', description: 'Archive or delete projects' },
  { code: 'projects.manage_members', module: 'projects', action: 'manage_members', description: 'Add/remove project members and assign project roles' },

  // Milestones
  { code: 'milestones.create', module: 'milestones', action: 'create', description: 'Create project milestones' },
  { code: 'milestones.read', module: 'milestones', action: 'read', description: 'View project milestones' },
  { code: 'milestones.update', module: 'milestones', action: 'update', description: 'Update milestone dates and status' },
  { code: 'milestones.delete', module: 'milestones', action: 'delete', description: 'Archive or delete milestones' },

  // Tasks & Subtasks
  { code: 'tasks.create', module: 'tasks', action: 'create', description: 'Create tasks and subtasks' },
  { code: 'tasks.read', module: 'tasks', action: 'read', description: 'View tasks, boards, and work items' },
  { code: 'tasks.update', module: 'tasks', action: 'update', description: 'Edit tasks, update status and progress' },
  { code: 'tasks.delete', module: 'tasks', action: 'delete', description: 'Archive or delete tasks' },
  { code: 'tasks.assign', module: 'tasks', action: 'assign', description: 'Assign or unassign members to tasks' },

  // Comments
  { code: 'comments.create', module: 'comments', action: 'create', description: 'Post comments and mention users on tasks' },
  { code: 'comments.read', module: 'comments', action: 'read', description: 'View task comment feeds' },
  { code: 'comments.update', module: 'comments', action: 'update', description: 'Edit own comments' },
  { code: 'comments.delete', module: 'comments', action: 'delete', description: 'Delete own comments or moderate discussions' },

  // Documents & Attachments
  { code: 'documents.upload', module: 'documents', action: 'upload', description: 'Upload project documents and task attachments' },
  { code: 'documents.read', module: 'documents', action: 'read', description: 'Download and view documents' },
  { code: 'documents.delete', module: 'documents', action: 'delete', description: 'Delete uploaded documents' },

  // Activity Logs
  { code: 'activity_logs.read', module: 'activity_logs', action: 'read', description: 'View audit and activity logs' },

  // Work Logs
  { code: 'worklogs.create', module: 'worklogs', action: 'create', description: 'Log time on assigned tasks' },
  { code: 'worklogs.read', module: 'worklogs', action: 'read', description: 'View work logs and timesheets' },
  { code: 'worklogs.update', module: 'worklogs', action: 'update', description: 'Edit time logs' },
  { code: 'worklogs.delete', module: 'worklogs', action: 'delete', description: 'Delete time logs' },

  // Timesheets
  { code: 'timesheets.create', module: 'timesheets', action: 'create', description: 'Create and edit draft weekly timesheets' },
  { code: 'timesheets.read', module: 'timesheets', action: 'read', description: 'View timesheet submissions' },
  { code: 'timesheets.submit', module: 'timesheets', action: 'submit', description: 'Submit timesheets for approval' },
  { code: 'timesheets.approve', module: 'timesheets', action: 'approve', description: 'Approve team timesheets' },
  { code: 'timesheets.reject', module: 'timesheets', action: 'reject', description: 'Reject timesheets with feedback' },
  { code: 'timesheets.lock', module: 'timesheets', action: 'lock', description: 'Lock approved timesheets' },

  // Planning, Workload & Calendar
  { code: 'calendar.read', module: 'calendar', action: 'read', description: 'View project schedule calendar' },
  { code: 'workload.read', module: 'workload', action: 'read', description: 'View resource workload and capacity allocation' },
  { code: 'timeline.read', module: 'timeline', action: 'read', description: 'View project timeline and Gantt charts' },
  { code: 'progress.read', module: 'progress', action: 'read', description: 'View project progress metrics and history' },

  // Risks
  { code: 'risks.create', module: 'risks', action: 'create', description: 'Create and register project risks' },
  { code: 'risks.read', module: 'risks', action: 'read', description: 'View project risk register and risk matrix' },
  { code: 'risks.update', module: 'risks', action: 'update', description: 'Update risk status, mitigation and contingency plans' },
  { code: 'risks.delete', module: 'risks', action: 'delete', description: 'Archive or delete risks' },

  // Issues
  { code: 'issues.create', module: 'issues', action: 'create', description: 'Report and create project issues' },
  { code: 'issues.read', module: 'issues', action: 'read', description: 'View project issues and resolutions' },
  { code: 'issues.update', module: 'issues', action: 'update', description: 'Update and resolve project issues' },
  { code: 'issues.delete', module: 'issues', action: 'delete', description: 'Archive or delete issues' },

  // Change Requests & Approvals
  { code: 'change_requests.create', module: 'change_requests', action: 'create', description: 'Create change requests with impact assessments' },
  { code: 'change_requests.read', module: 'change_requests', action: 'read', description: 'View project change requests and approvals' },
  { code: 'change_requests.update', module: 'change_requests', action: 'update', description: 'Edit draft change requests' },
  { code: 'change_requests.submit', module: 'change_requests', action: 'submit', description: 'Submit change requests for review' },
  { code: 'change_requests.approve', module: 'change_requests', action: 'approve', description: 'Approve or reject change requests' },
  { code: 'change_requests.delete', module: 'change_requests', action: 'delete', description: 'Cancel or remove change requests' },

  // Project & Task Templates
  { code: 'templates.create', module: 'templates', action: 'create', description: 'Create project and task templates' },
  { code: 'templates.read', module: 'templates', action: 'read', description: 'Browse and inspect project and task templates' },
  { code: 'templates.update', module: 'templates', action: 'update', description: 'Modify project and task templates' },
  { code: 'templates.delete', module: 'templates', action: 'delete', description: 'Delete templates' },
  { code: 'templates.instantiate', module: 'templates', action: 'instantiate', description: 'Generate complete projects from templates' },

  // Recurring Tasks
  { code: 'recurring_tasks.create', module: 'recurring_tasks', action: 'create', description: 'Create recurring task schedules' },
  { code: 'recurring_tasks.read', module: 'recurring_tasks', action: 'read', description: 'View recurring task definitions' },
  { code: 'recurring_tasks.update', module: 'recurring_tasks', action: 'update', description: 'Update or pause recurring task schedules' },
  { code: 'recurring_tasks.delete', module: 'recurring_tasks', action: 'delete', description: 'Delete recurring task definitions' },

  // Project Baselines
  { code: 'baselines.create', module: 'baselines', action: 'create', description: 'Create project baseline snapshots' },
  { code: 'baselines.read', module: 'baselines', action: 'read', description: 'View project baselines and compare variances' },

  // Project Governance, Health Override, Archive & Restore
  { code: 'projects.health_override', module: 'projects', action: 'health_override', description: 'Manually override or reset project health status' },
  { code: 'projects.archive', module: 'projects', action: 'archive', description: 'Archive completed projects' },
  { code: 'projects.restore', module: 'projects', action: 'restore', description: 'Restore archived projects to active state' },

  // Project Financial Management (STRICT SUPER ADMIN ONLY)
  { code: 'finance.read', module: 'finance', action: 'read', description: 'View financial dashboard, cash positions, and project financials' },
  { code: 'finance.manage', module: 'finance', action: 'manage', description: 'Configure project value, client payments, and expenses' },
  { code: 'finance.export', module: 'finance', action: 'export', description: 'Export financial reports and summaries' },
];

async function cleanAndReset() {
  console.log('🧹 Starting safe database cleanup for production candidate testing...');

  // 1. Clean All Demo/Dummy Business Records in Safe Cascade Order
  console.log('  → Purging demo financial records...');
  await prisma.clientPayment.deleteMany({});
  await prisma.projectExpense.deleteMany({});
  await prisma.financialAuditLog.deleteMany({});
  await prisma.projectFinancial.deleteMany({});

  console.log('  → Purging demo governance, baselines, change requests, risks, and issues...');
  await prisma.approvalStep.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.changeRequest.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.risk.deleteMany({});
  await prisma.projectBaselineSnapshot.deleteMany({});
  await prisma.projectBaseline.deleteMany({});
  await prisma.recurringTaskDefinition.deleteMany({});
  await prisma.taskTemplateDependency.deleteMany({});
  await prisma.taskTemplate.deleteMany({});
  await prisma.milestoneTemplate.deleteMany({});
  await prisma.projectTemplate.deleteMany({});

  console.log('  → Purging demo time logs, timesheets, and capacity records...');
  await prisma.workLog.deleteMany({});
  await prisma.timesheet.deleteMany({});
  await prisma.userCapacity.deleteMany({});
  await prisma.progressHistory.deleteMany({});

  console.log('  → Purging demo tasks, comments, documents, and milestones...');
  await prisma.taskComment.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.milestone.deleteMany({});

  console.log('  → Purging demo projects and clients...');
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});

  console.log('  → Purging demo teams...');
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});

  console.log('  → Purging activity logs for cleaned demo entities...');
  await prisma.activityLog.deleteMany({});

  // 2. Identify and Preserve Super Admin User while removing non-essential sample users
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@pmp.local';
  console.log(`  → Purging demo users except master Super Admin (${superAdminEmail})...`);
  const demoUsers = await prisma.user.findMany({
    where: { email: { not: superAdminEmail } },
    select: { id: true, email: true },
  });

  if (demoUsers.length > 0) {
    const demoUserIds = demoUsers.map((u) => u.id);
    await prisma.refreshToken.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
    console.log(`    ✓ Removed ${demoUsers.length} demo user accounts`);
  }

  // 3. Ensure Master Configuration Integrity
  console.log('  → Ensuring system permissions are fully synced...');
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module, action: perm.action },
      create: perm,
    });
    permissionMap.set(perm.code, record.id);
  }

  console.log('  → Ensuring system roles are intact...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { displayName: 'Super Administrator', description: 'Full system access and administrative control' },
    create: {
      name: 'SUPER_ADMIN',
      displayName: 'Super Administrator',
      description: 'Full system access and administrative control',
      isSystem: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { displayName: 'Administrator', description: 'Operational administration across all modules' },
    create: {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Operational administration across all modules',
      isSystem: true,
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: { displayName: 'User', description: 'Standard user access to assigned projects and team resources' },
    create: {
      name: 'USER',
      displayName: 'User',
      description: 'Standard user access to assigned projects and team resources',
      isSystem: true,
    },
  });

  // 4. Ensure Role-Permission Mappings
  console.log('  → Verifying role-permission mappings...');
  // Super Admin gets ALL permissions
  for (const [, permId] of permissionMap.entries()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permId,
      },
    });
  }

  // Admin gets operational permissions
  const adminPermissions = PERMISSIONS.filter(
    (p) =>
      p.code !== 'roles.manage' &&
      !p.module.startsWith('finance') &&
      !p.module.startsWith('invoices') &&
      !p.module.startsWith('payments'),
  );
  for (const perm of adminPermissions) {
    const permId = permissionMap.get(perm.code)!;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permId,
      },
    });
  }

  // User permissions
  const userPermissions = [
    'users.read',
    'departments.read',
    'teams.read',
    'projects.read',
    'milestones.read',
    'tasks.read',
    'tasks.update',
    'comments.create',
    'comments.read',
    'comments.update',
    'documents.read',
    'documents.upload',
    'worklogs.create',
    'worklogs.read',
    'worklogs.update',
    'worklogs.delete',
    'timesheets.create',
    'timesheets.read',
    'timesheets.submit',
    'calendar.read',
    'timeline.read',
    'progress.read',
    'risks.read',
    'risks.create',
    'risks.update',
    'issues.read',
    'issues.create',
    'issues.update',
    'change_requests.read',
    'change_requests.create',
    'change_requests.update',
    'change_requests.submit',
    'templates.read',
    'recurring_tasks.read',
    'baselines.read',
  ];
  for (const code of userPermissions) {
    const permId = permissionMap.get(code);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: userRole.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permId,
        },
      });
    }
  }

  // 5. Ensure Master Reference Departments
  console.log('  → Ensuring default master departments...');
  const engineeringDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      description: 'Software development, infrastructure, and technical operations',
      status: GeneralStatus.ACTIVE,
    },
  });

  await prisma.department.upsert({
    where: { name: 'Product Design' },
    update: {},
    create: {
      name: 'Product Design',
      description: 'UI/UX design, design systems, user research',
      status: GeneralStatus.ACTIVE,
    },
  });

  await prisma.department.upsert({
    where: { name: 'Product Management' },
    update: {},
    create: {
      name: 'Product Management',
      description: 'Product strategy, roadmaps, and delivery execution',
      status: GeneralStatus.ACTIVE,
    },
  });

  // 6. Ensure Super Admin Account
  console.log('  → Ensuring primary Super Admin account...');
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: superAdminHash,
      departmentId: engineeringDept.id,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
    create: {
      email: superAdminEmail,
      passwordHash: superAdminHash,
      firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'System',
      lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Super Admin',
      status: UserStatus.ACTIVE,
      departmentId: engineeringDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('✨ Safe database cleanup completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Clean Portal Ready for Live Manual Testing:');
  console.log(`  Super Admin Login: ${superAdminEmail} / ${superAdminPassword}`);
  console.log('  Remaining Projects: 0');
  console.log('  Remaining Clients:  0');
  console.log('  Remaining Tasks:    0');
  console.log('  Remaining Invoices: 0');
  console.log('  Preserved Roles:    SUPER_ADMIN, ADMIN, USER');
  console.log(`  Preserved Perms:    ${PERMISSIONS.length} granular permissions`);
  console.log('----------------------------------------------------');
}

cleanAndReset()
  .catch((e) => {
    console.error('❌ Error executing database cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
