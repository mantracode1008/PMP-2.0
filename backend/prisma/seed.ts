import {
  PrismaClient,
  UserStatus,
  GeneralStatus,
  ProjectStatus,
  ProjectHealth,
  ProjectMemberRole,
  TeamMemberRole,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  DependencyType,
  DocumentEntityType,
} from '@prisma/client';
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

  // Milestones (Phase 2)
  { code: 'milestones.create', module: 'milestones', action: 'create', description: 'Create project milestones' },
  { code: 'milestones.read', module: 'milestones', action: 'read', description: 'View project milestones' },
  { code: 'milestones.update', module: 'milestones', action: 'update', description: 'Update milestone dates and status' },
  { code: 'milestones.delete', module: 'milestones', action: 'delete', description: 'Archive or delete milestones' },

  // Tasks & Subtasks (Phase 2)
  { code: 'tasks.create', module: 'tasks', action: 'create', description: 'Create tasks and subtasks' },
  { code: 'tasks.read', module: 'tasks', action: 'read', description: 'View tasks, boards, and work items' },
  { code: 'tasks.update', module: 'tasks', action: 'update', description: 'Edit tasks, update status and progress' },
  { code: 'tasks.delete', module: 'tasks', action: 'delete', description: 'Archive or delete tasks' },
  { code: 'tasks.assign', module: 'tasks', action: 'assign', description: 'Assign or unassign members to tasks' },

  // Comments (Phase 2)
  { code: 'comments.create', module: 'comments', action: 'create', description: 'Post comments and mention users on tasks' },
  { code: 'comments.read', module: 'comments', action: 'read', description: 'View task comment feeds' },
  { code: 'comments.update', module: 'comments', action: 'update', description: 'Edit own comments' },
  { code: 'comments.delete', module: 'comments', action: 'delete', description: 'Delete own comments or moderate discussions' },

  // Documents & Attachments (Phase 2)
  { code: 'documents.upload', module: 'documents', action: 'upload', description: 'Upload project documents and task attachments' },
  { code: 'documents.read', module: 'documents', action: 'read', description: 'Download and view documents' },
  { code: 'documents.delete', module: 'documents', action: 'delete', description: 'Delete uploaded documents' },

  // Activity Logs
  { code: 'activity_logs.read', module: 'activity_logs', action: 'read', description: 'View audit and activity logs' },

  // Work Logs (Phase 3)
  { code: 'worklogs.create', module: 'worklogs', action: 'create', description: 'Log time on assigned tasks' },
  { code: 'worklogs.read', module: 'worklogs', action: 'read', description: 'View work logs and timesheets' },
  { code: 'worklogs.update', module: 'worklogs', action: 'update', description: 'Edit time logs' },
  { code: 'worklogs.delete', module: 'worklogs', action: 'delete', description: 'Delete time logs' },

  // Timesheets (Phase 3)
  { code: 'timesheets.create', module: 'timesheets', action: 'create', description: 'Create and edit draft weekly timesheets' },
  { code: 'timesheets.read', module: 'timesheets', action: 'read', description: 'View timesheet submissions' },
  { code: 'timesheets.submit', module: 'timesheets', action: 'submit', description: 'Submit timesheets for approval' },
  { code: 'timesheets.approve', module: 'timesheets', action: 'approve', description: 'Approve team timesheets' },
  { code: 'timesheets.reject', module: 'timesheets', action: 'reject', description: 'Reject timesheets with feedback' },
  { code: 'timesheets.lock', module: 'timesheets', action: 'lock', description: 'Lock approved timesheets' },

  // Planning, Workload & Calendar (Phase 3)
  { code: 'calendar.read', module: 'calendar', action: 'read', description: 'View project schedule calendar' },
  { code: 'workload.read', module: 'workload', action: 'read', description: 'View resource workload and capacity allocation' },
  { code: 'timeline.read', module: 'timeline', action: 'read', description: 'View project timeline and Gantt charts' },
  { code: 'progress.read', module: 'progress', action: 'read', description: 'View project progress metrics and history' },

  // Risks (Phase 4)
  { code: 'risks.create', module: 'risks', action: 'create', description: 'Create and register project risks' },
  { code: 'risks.read', module: 'risks', action: 'read', description: 'View project risk register and risk matrix' },
  { code: 'risks.update', module: 'risks', action: 'update', description: 'Update risk status, mitigation and contingency plans' },
  { code: 'risks.delete', module: 'risks', action: 'delete', description: 'Archive or delete risks' },

  // Issues (Phase 4)
  { code: 'issues.create', module: 'issues', action: 'create', description: 'Report and create project issues' },
  { code: 'issues.read', module: 'issues', action: 'read', description: 'View project issues and resolutions' },
  { code: 'issues.update', module: 'issues', action: 'update', description: 'Update and resolve project issues' },
  { code: 'issues.delete', module: 'issues', action: 'delete', description: 'Archive or delete issues' },

  // Change Requests & Approvals (Phase 4)
  { code: 'change_requests.create', module: 'change_requests', action: 'create', description: 'Create change requests with impact assessments' },
  { code: 'change_requests.read', module: 'change_requests', action: 'read', description: 'View project change requests and approvals' },
  { code: 'change_requests.update', module: 'change_requests', action: 'update', description: 'Edit draft change requests' },
  { code: 'change_requests.submit', module: 'change_requests', action: 'submit', description: 'Submit change requests for review' },
  { code: 'change_requests.approve', module: 'change_requests', action: 'approve', description: 'Approve or reject change requests' },
  { code: 'change_requests.delete', module: 'change_requests', action: 'delete', description: 'Cancel or remove change requests' },

  // Project & Task Templates (Phase 4)
  { code: 'templates.create', module: 'templates', action: 'create', description: 'Create project and task templates' },
  { code: 'templates.read', module: 'templates', action: 'read', description: 'Browse and inspect project and task templates' },
  { code: 'templates.update', module: 'templates', action: 'update', description: 'Modify project and task templates' },
  { code: 'templates.delete', module: 'templates', action: 'delete', description: 'Delete templates' },
  { code: 'templates.instantiate', module: 'templates', action: 'instantiate', description: 'Generate complete projects from templates' },

  // Recurring Tasks (Phase 4)
  { code: 'recurring_tasks.create', module: 'recurring_tasks', action: 'create', description: 'Create recurring task schedules' },
  { code: 'recurring_tasks.read', module: 'recurring_tasks', action: 'read', description: 'View recurring task definitions' },
  { code: 'recurring_tasks.update', module: 'recurring_tasks', action: 'update', description: 'Update or pause recurring task schedules' },
  { code: 'recurring_tasks.delete', module: 'recurring_tasks', action: 'delete', description: 'Delete recurring task definitions' },

  // Project Baselines (Phase 4)
  { code: 'baselines.create', module: 'baselines', action: 'create', description: 'Create project baseline snapshots' },
  { code: 'baselines.read', module: 'baselines', action: 'read', description: 'View project baselines and compare variances' },

  // Project Governance, Health Override, Archive & Restore (Phase 4)
  { code: 'projects.health_override', module: 'projects', action: 'health_override', description: 'Manually override or reset project health status' },
  { code: 'projects.archive', module: 'projects', action: 'archive', description: 'Archive completed projects' },
  { code: 'projects.restore', module: 'projects', action: 'restore', description: 'Restore archived projects to active state' },

  // Project Financial Management (Phase 5 - STRICT SUPER ADMIN ONLY)
  { code: 'finance.read', module: 'finance', action: 'read', description: 'View financial dashboard, cash positions, and project financials' },
  { code: 'finance.manage', module: 'finance', action: 'manage', description: 'Configure project value, client payments, and expenses' },
  { code: 'finance.export', module: 'finance', action: 'export', description: 'Export financial reports and summaries' },
];

async function main() {
  console.log('🌱 Starting database seed for Phase 1 & Phase 2...');

  // 1. Seed Permissions
  console.log('  → Seeding permissions...');
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module, action: perm.action },
      create: perm,
    });
    permissionMap.set(perm.code, record.id);
  }

  // 2. Seed Roles
  console.log('  → Seeding roles...');
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

  // 3. Link Role Permissions
  console.log('  → Linking role permissions...');
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

  // Admin gets all except deep role governance and financial management
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

  // Standard User gets operational project permissions
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
    // Phase 3 Permissions
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
    // Phase 4 Permissions
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

  // 4. Seed Departments
  console.log('  → Seeding departments...');
  const engineeringDept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      description: 'Software development, infrastructure, and technical operations',
      status: GeneralStatus.ACTIVE,
    },
  });

  const designDept = await prisma.department.upsert({
    where: { name: 'Product Design' },
    update: {},
    create: {
      name: 'Product Design',
      description: 'UI/UX design, design systems, user research',
      status: GeneralStatus.ACTIVE,
    },
  });

  const productDept = await prisma.department.upsert({
    where: { name: 'Product Management' },
    update: {},
    create: {
      name: 'Product Management',
      description: 'Product strategy, roadmaps, and delivery execution',
      status: GeneralStatus.ACTIVE,
    },
  });

  // 5. Seed Super Admin User
  console.log('  → Seeding initial Super Admin...');
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@pmp.local';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: superAdminHash,
      departmentId: engineeringDept.id,
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

  // 6. Seed Sample Admin and Regular Users
  console.log('  → Seeding sample users...');
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const regularPasswordHash = await bcrypt.hash('User123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.user@pmp.local' },
    update: {},
    create: {
      email: 'admin.user@pmp.local',
      passwordHash: adminPasswordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+1 (555) 234-5678',
      status: UserStatus.ACTIVE,
      departmentId: productDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  const developerUser = await prisma.user.upsert({
    where: { email: 'john.doe@pmp.local' },
    update: {},
    create: {
      email: 'john.doe@pmp.local',
      passwordHash: regularPasswordHash,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 345-6789',
      status: UserStatus.ACTIVE,
      departmentId: engineeringDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: developerUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: developerUser.id,
      roleId: userRole.id,
    },
  });

  const designerUser = await prisma.user.upsert({
    where: { email: 'elena.rostova@pmp.local' },
    update: {},
    create: {
      email: 'elena.rostova@pmp.local',
      passwordHash: regularPasswordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      phone: '+1 (555) 456-7890',
      status: UserStatus.ACTIVE,
      departmentId: designDept.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: designerUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: designerUser.id,
      roleId: userRole.id,
    },
  });

  // 7. Seed Teams
  console.log('  → Seeding teams...');
  const frontendTeam = await prisma.team.upsert({
    where: { id: 'team-frontend-core' },
    update: {},
    create: {
      id: 'team-frontend-core',
      name: 'Frontend Core Team',
      description: 'Maintains design system and web application client experiences',
      departmentId: engineeringDept.id,
      teamLeadId: developerUser.id,
      status: GeneralStatus.ACTIVE,
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: frontendTeam.id,
        userId: developerUser.id,
      },
    },
    update: {},
    create: {
      teamId: frontendTeam.id,
      userId: developerUser.id,
      role: TeamMemberRole.LEAD,
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: frontendTeam.id,
        userId: designerUser.id,
      },
    },
    update: {},
    create: {
      teamId: frontendTeam.id,
      userId: designerUser.id,
      role: TeamMemberRole.MEMBER,
    },
  });

  // 8. Seed Clients
  console.log('  → Seeding clients...');
  const clientAcme = await prisma.client.upsert({
    where: { email: 'contact@acmecorp.com' },
    update: {},
    create: {
      name: 'Acme Enterprise',
      companyName: 'Acme Corporation Inc.',
      email: 'contact@acmecorp.com',
      phone: '+1 (800) 555-0199',
      website: 'https://acmecorp.com',
      address: '100 Enterprise Way, Suite 400, San Francisco, CA 94105',
      status: GeneralStatus.ACTIVE,
    },
  });

  const clientTechNova = await prisma.client.upsert({
    where: { email: 'partnerships@technova.io' },
    update: {},
    create: {
      name: 'TechNova Cloud',
      companyName: 'TechNova Solutions LLC',
      email: 'partnerships@technova.io',
      phone: '+1 (888) 555-0144',
      website: 'https://technova.io',
      address: '450 Innovation Blvd, Austin, TX 78701',
      status: GeneralStatus.ACTIVE,
    },
  });

  // 9. Seed Projects
  console.log('  → Seeding projects...');
  const project1 = await prisma.project.upsert({
    where: { code: 'PRJ-001' },
    update: {},
    create: {
      code: 'PRJ-001',
      name: 'Cloud Migration & Infrastructure Overhaul',
      description: 'Complete containerization and cloud modernization for core enterprise workflow services.',
      status: ProjectStatus.ACTIVE,
      health: ProjectHealth.HEALTHY,
      clientId: clientAcme.id,
      ownerId: adminUser.id,
      startDate: new Date('2026-01-15'),
      targetDate: new Date('2026-09-30'),
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project1.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: adminUser.id,
      projectRole: ProjectMemberRole.MANAGER,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project1.id,
        userId: developerUser.id,
      },
    },
    update: {},
    create: {
      projectId: project1.id,
      userId: developerUser.id,
      projectRole: ProjectMemberRole.MEMBER,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { code: 'PRJ-002' },
    update: {},
    create: {
      code: 'PRJ-002',
      name: 'NextGen Design System & Component Library',
      description: 'Unified component architecture and interactive tokens for global product portfolio.',
      status: ProjectStatus.PLANNING,
      health: ProjectHealth.HEALTHY,
      clientId: clientTechNova.id,
      ownerId: adminUser.id,
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-11-15'),
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: project2.id,
        userId: designerUser.id,
      },
    },
    update: {},
    create: {
      projectId: project2.id,
      userId: designerUser.id,
      projectRole: ProjectMemberRole.MEMBER,
    },
  });

  // 10. Phase 2 Seeding: Milestones & Tasks (clean existing for idempotency)
  console.log('  → Resetting and seeding milestones & tasks...');
  await prisma.document.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();

  const milestoneM1 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'M1: Containerization & Base Cluster Setup',
      description: 'Deploy Kubernetes infrastructure, VPC peering, and base Docker containers.',
      status: MilestoneStatus.COMPLETED,
      startDate: new Date('2026-01-15'),
      dueDate: new Date('2026-03-15'),
      createdById: adminUser.id,
    },
  });

  const milestoneM2 = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: 'M2: Data Layer & Secrets Migration',
      description: 'Migrate relational databases to RDS and configure KMS secret rotation.',
      status: MilestoneStatus.IN_PROGRESS,
      startDate: new Date('2026-03-16'),
      dueDate: new Date('2026-06-30'),
      createdById: adminUser.id,
    },
  });

  // 11. Phase 2 Seeding: Tasks, Assignees, Subtasks, Dependencies
  console.log('  → Seeding tasks & subtasks...');
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      milestoneId: milestoneM1.id,
      taskNumber: 1,
      title: 'Dockerize NestJS and Next.js micro-services',
      description: 'Create multi-stage production Dockerfiles with non-root security contexts.',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      startDate: new Date('2026-01-20'),
      dueDate: new Date('2026-02-10'),
      estimatedHours: 24,
      progress: 100,
      createdById: adminUser.id,
      assignees: {
        create: [{ userId: developerUser.id }],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      milestoneId: milestoneM2.id,
      taskNumber: 2,
      title: 'PostgreSQL 16 High Availability Configuration',
      description: 'Establish multi-AZ standby replication and configure PgBouncer connection pooling.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      startDate: new Date('2026-03-20'),
      dueDate: new Date('2026-04-15'),
      estimatedHours: 40,
      progress: 50,
      createdById: adminUser.id,
      assignees: {
        create: [{ userId: developerUser.id }, { userId: adminUser.id }],
      },
    },
  });

  // Subtasks for Task 2
  const subtask2_1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      parentTaskId: task2.id,
      taskNumber: 3,
      title: 'Configure replication user credentials and SSL certificates',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      progress: 100,
      createdById: adminUser.id,
      assignees: {
        create: [{ userId: developerUser.id }],
      },
    },
  });

  const subtask2_2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      parentTaskId: task2.id,
      taskNumber: 4,
      title: 'Benchmark read latency under 1,000 concurrent pooled queries',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      progress: 0,
      createdById: adminUser.id,
      assignees: {
        create: [{ userId: developerUser.id }],
      },
    },
  });

  // Task 3 with Dependency: Task 2 -> Task 3 (Task 2 BLOCKS Task 3)
  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      milestoneId: milestoneM2.id,
      taskNumber: 5,
      title: 'Execute Production Database Cutover Runbook',
      description: 'Execute zero-downtime DNS swap and verify data consistency checks.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.HIGH,
      startDate: new Date('2026-05-01'),
      dueDate: new Date('2026-05-15'),
      estimatedHours: 16,
      progress: 0,
      createdById: adminUser.id,
      assignees: {
        create: [{ userId: developerUser.id }],
      },
    },
  });

  await prisma.taskDependency.create({
    data: {
      taskId: task3.id,
      dependsOnTaskId: task2.id,
      dependencyType: DependencyType.DEPENDS_ON,
    },
  });

  // 12. Phase 2 Seeding: Task Comments with @Mentions
  console.log('  → Seeding task comments...');
  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: adminUser.id,
      content: 'Hey @John, please make sure we enable SSL mode verify-full in the client connection string.',
      mentions: [developerUser.id],
    },
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: developerUser.id,
      content: 'Got it @Sarah! Verified the certificate authority certs and tested the handshake locally.',
      mentions: [adminUser.id],
    },
  });

  // 13. Phase 2 Seeding: Project Documents
  console.log('  → Seeding project documents...');
  await prisma.document.create({
    data: {
      entityType: DocumentEntityType.PROJECT,
      projectId: project1.id,
      fileName: 'cloud_migration_architecture_v1.pdf',
      originalFileName: 'Cloud Migration Architecture Specification v1.pdf',
      mimeType: 'application/pdf',
      fileSize: 2450000,
      storagePath: 'documents/PRJ-001/cloud_migration_architecture_v1.pdf',
      uploadedById: adminUser.id,
    },
  });

  // 14. Phase 3 Seeding: User Capacities, Work Logs, Timesheets
  console.log('  → Seeding Phase 3: User Capacities & Working Schedules...');
  await prisma.workLog.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.userCapacity.deleteMany();
  await prisma.progressHistory.deleteMany();

  const allUsers = [superAdminUser, adminUser, developerUser, designerUser];
  for (const u of allUsers) {
    await prisma.userCapacity.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        dailyCapacityMinutes: 480, // 8 hours
        weeklyCapacityMinutes: 2400, // 40 hours
        workingDays: [1, 2, 3, 4, 5],
      },
    });
  }

  console.log('  → Seeding Phase 3: Sample Work Logs & Timesheets...');
  // Work logs for developerUser on Task 1 and Task 2
  const logDate1 = new Date('2026-03-23T10:00:00Z');
  const logDate2 = new Date('2026-03-24T14:30:00Z');
  const logDate3 = new Date('2026-03-25T09:00:00Z');

  const workLog1 = await prisma.workLog.create({
    data: {
      userId: developerUser.id,
      projectId: project1.id,
      taskId: task1.id,
      date: logDate1,
      durationMinutes: 240, // 4h
      description: 'Setup base Alpine image and installed nestjs build tooling',
      billable: true,
    },
  });

  const workLog2 = await prisma.workLog.create({
    data: {
      userId: developerUser.id,
      projectId: project1.id,
      taskId: task2.id,
      date: logDate2,
      durationMinutes: 180, // 3h
      description: 'Configured pg_hba.conf and SSL authentication for standbys',
      billable: true,
    },
  });

  const workLog3 = await prisma.workLog.create({
    data: {
      userId: developerUser.id,
      projectId: project1.id,
      taskId: task2.id,
      date: logDate3,
      durationMinutes: 120, // 2h
      description: 'Tested failover latency across simulated AZ drop',
      billable: true,
    },
  });

  // Seed Weekly Timesheet for Developer (Submitted)
  const timesheetDev = await prisma.timesheet.create({
    data: {
      userId: developerUser.id,
      startDate: new Date('2026-03-23T00:00:00Z'),
      endDate: new Date('2026-03-29T23:59:59Z'),
      status: 'SUBMITTED',
      submittedAt: new Date('2026-03-29T18:00:00Z'),
      workLogs: {
        connect: [{ id: workLog1.id }, { id: workLog2.id }, { id: workLog3.id }],
      },
    },
  });

  // Seed Progress Snapshot
  await prisma.progressHistory.create({
    data: {
      projectId: project1.id,
      progress: 65,
      totalEstimatedHours: 64,
      totalActualMinutes: 540, // 9 hours
      recordedAt: new Date('2026-03-25T18:00:00Z'),
    },
  });

  // ----------------------------------------------------
  // Phase 4 Seed Data: Governance & Templates
  // ----------------------------------------------------
  console.log('  → Seeding Phase 4 Governance (Templates, Risks, Issues, Change Requests)...');

  // Seed Project Template
  const webTemplate = await prisma.projectTemplate.upsert({
    where: { name: 'Full-Stack Web Application Template' },
    update: {},
    create: {
      name: 'Full-Stack Web Application Template',
      description: 'Standard boilerplate workflow for full-stack web and mobile systems with discovery, architecture, build, QA and deployment stages.',
      category: 'Software Engineering',
      estimatedDurationDays: 60,
      defaultRoles: ['PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'QA'],
      isSystem: true,
      createdById: superAdminUser.id,
      milestones: {
        create: [
          {
            name: '1. Discovery & Design',
            description: 'Requirements analysis, technical specs, wireframes, and design system',
            orderIndex: 0,
            targetDayOffset: 14,
            tasks: {
              create: [
                {
                  title: 'Stakeholder discovery and PRD review',
                  description: 'Align business requirements and technical feasibility',
                  priority: 'HIGH',
                  estimatedHours: 16,
                  defaultRole: 'PROJECT_MANAGER',
                  orderIndex: 0,
                  targetDayOffset: 5,
                  checklist: ['Review scope', 'Document constraints', 'Sign off on milestones'],
                },
                {
                  title: 'Figma UI/UX high-fidelity prototypes',
                  description: 'Design key responsive views and interactive components',
                  priority: 'MEDIUM',
                  estimatedHours: 32,
                  defaultRole: 'DESIGNER',
                  orderIndex: 1,
                  targetDayOffset: 12,
                  checklist: ['Create design tokens', 'Build component library', 'Prototype core flows'],
                },
              ],
            },
          },
          {
            name: '2. Core Platform Engineering',
            description: 'Backend APIs, database migration, authentication, and frontend integration',
            orderIndex: 1,
            targetDayOffset: 45,
            tasks: {
              create: [
                {
                  title: 'Setup Database schemas and NestJS backend modules',
                  description: 'Implement models, controllers, services, guards and validation',
                  priority: 'HIGH',
                  estimatedHours: 40,
                  defaultRole: 'DEVELOPER',
                  orderIndex: 0,
                  targetDayOffset: 25,
                  checklist: ['Schema design', 'CRUD endpoints', 'JWT auth and RBAC'],
                },
                {
                  title: 'Frontend page assembly and API integration',
                  description: 'Develop responsive React/Next.js dashboard and features',
                  priority: 'HIGH',
                  estimatedHours: 48,
                  defaultRole: 'DEVELOPER',
                  orderIndex: 1,
                  targetDayOffset: 40,
                  checklist: ['API client layer', 'State management', 'Component styling'],
                },
              ],
            },
          },
          {
            name: '3. QA, Security & Production Launch',
            description: 'Automated testing, load testing, SAIF security review, and deployment',
            orderIndex: 2,
            targetDayOffset: 60,
            tasks: {
              create: [
                {
                  title: 'End-to-End Test Suite and Security Audit',
                  description: 'Execute automated regression and OWASP vulnerability review',
                  priority: 'HIGH',
                  estimatedHours: 24,
                  defaultRole: 'QA',
                  orderIndex: 0,
                  targetDayOffset: 55,
                  checklist: ['Run e2e suite', 'Penetration testing', 'Fix high severity bugs'],
                },
                {
                  title: 'CI/CD Production Deployment and Monitoring',
                  description: 'Configure staging/prod pipelines and alerting rules',
                  priority: 'MEDIUM',
                  estimatedHours: 16,
                  defaultRole: 'DEVELOPER',
                  orderIndex: 1,
                  targetDayOffset: 59,
                  checklist: ['Setup Docker builds', 'Configure domain & SSL', 'Health checks'],
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Seed Risks on Project 1
  const risk1 = await prisma.risk.upsert({
    where: { projectId_riskNumber: { projectId: project1.id, riskNumber: 1 } },
    update: {},
    create: {
      projectId: project1.id,
      riskNumber: 1,
      title: 'Third-party API rate limits could degrade real-time sync',
      description: 'Upstream payment and CRM gateways enforce strict 100 req/sec throttles.',
      category: 'TECHNICAL',
      status: 'MONITORING',
      probability: 'MEDIUM', // 2
      impact: 'HIGH', // 3
      riskScore: 6, // 2 * 3 = 6
      ownerId: adminUser.id,
      createdById: superAdminUser.id,
      mitigationPlan: 'Implement Redis queue buffering and exponential backoff retry mechanism.',
      contingencyPlan: 'Temporarily switch to scheduled batch synchronization mode.',
      identifiedDate: new Date('2026-03-05T09:00:00Z'),
      reviewDate: new Date('2026-04-01T09:00:00Z'),
    },
  });

  const risk2 = await prisma.risk.upsert({
    where: { projectId_riskNumber: { projectId: project1.id, riskNumber: 2 } },
    update: {},
    create: {
      projectId: project1.id,
      riskNumber: 2,
      title: 'Key lead DevOps engineer availability bottleneck',
      description: 'Single point of failure on Kubernetes cluster provisioning and secret management.',
      category: 'RESOURCE',
      status: 'OPEN',
      probability: 'HIGH', // 3
      impact: 'CRITICAL', // 4
      riskScore: 12, // 3 * 4 = 12 (High risk)
      ownerId: adminUser.id,
      createdById: adminUser.id,
      mitigationPlan: 'Cross-train two backend developers on Terraform deployment manifests.',
      contingencyPlan: 'Engage on-demand DevOps contractor if lead is unavailable.',
      identifiedDate: new Date('2026-03-10T10:00:00Z'),
      reviewDate: new Date('2026-03-30T10:00:00Z'),
    },
  });

  // Seed Issues on Project 1
  const issue1 = await prisma.issue.upsert({
    where: { projectId_issueNumber: { projectId: project1.id, issueNumber: 1 } },
    update: {},
    create: {
      projectId: project1.id,
      issueNumber: 1,
      title: 'PostgreSQL read-replica latency exceeds 500ms under load testing',
      description: 'Observed intermittent replication lag during high concurrent write batches in staging.',
      type: 'TECHNICAL',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      reportedById: developerUser.id,
      ownerId: developerUser.id,
      taskId: task2.id,
      milestoneId: milestoneM1.id,
      reportedDate: new Date('2026-03-22T14:00:00Z'),
      dueDate: new Date('2026-03-29T18:00:00Z'),
    },
  });

  // Seed Change Request on Project 1
  const changeReq1 = await prisma.changeRequest.upsert({
    where: { projectId_requestNumber: { projectId: project1.id, requestNumber: 1 } },
    update: {},
    create: {
      projectId: project1.id,
      requestNumber: 1,
      title: 'Add Single Sign-On (SSO) with Okta and SAML 2.0',
      description: 'Enterprise client requested SAML SSO integration for corporate compliance.',
      type: 'REQUIREMENT',
      status: 'SUBMITTED',
      reason: 'Client security policy requires central Identity Provider authentication.',
      impactSummary: 'Requires Passport SAML strategy and new user provisioning pipeline.',
      scheduleImpactDays: 7,
      costImpact: 'Additional 40 engineering hours estimated',
      resourceImpact: '+1 Backend security engineer for 1 sprint',
      scopeImpact: 'SAML metadata exchange, ACS endpoint, and JIT user provisioning',
      riskImpact: 'Low risk; standard OAuth/JWT auth remains unchanged as fallback',
      requestedById: developerUser.id,
      requestedAt: new Date('2026-03-24T11:00:00Z'),
    },
  });

  // Seed Initial Project Baseline for Project 1
  const baseline1 = await prisma.projectBaseline.upsert({
    where: { projectId_baselineNumber: { projectId: project1.id, baselineNumber: 1 } },
    update: {},
    create: {
      projectId: project1.id,
      baselineNumber: 1,
      name: 'Initial Approved Architecture Baseline (v1.0)',
      description: 'Original approved schedule and scope following kickoff milestone review.',
      createdById: superAdminUser.id,
      createdAt: new Date('2026-03-01T00:00:00Z'),
      snapshot: {
        create: {
          totalTasks: 4,
          totalMilestones: 2,
          totalEstimatedHours: 64,
          plannedStartDate: new Date('2026-03-01T00:00:00Z'),
          plannedEndDate: new Date('2026-04-15T00:00:00Z'),
          snapshotData: {
            milestonesCount: 2,
            tasksCount: 4,
            plannedHours: 64,
            targetEndDate: '2026-04-15T00:00:00Z',
          },
        },
      },
    },
  });

  // ----------------------------------------------------
  // Phase 5: Project Financial Management Seed Data
  // ----------------------------------------------------
  console.log('  → Seeding Phase 5: Project Financials, Client Payments & Expenses...');

  // 1. Project 1 Financial Settings (Value: 50,000 INR)
  await prisma.projectFinancial.upsert({
    where: { projectId: project1.id },
    update: { projectValue: 50000, currency: 'INR' },
    create: {
      projectId: project1.id,
      currency: 'INR',
      projectValue: 50000,
      createdById: superAdminUser.id,
    },
  });

  // 2. Project 1 Client Payments (Total received: 30,000 INR)
  await prisma.clientPayment.createMany({
    data: [
      {
        projectId: project1.id,
        amount: 10000,
        paymentDate: new Date('2026-03-15T00:00:00Z'),
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/2026/0315-9921',
        notes: 'Initial kickoff advance payment received',
        createdById: superAdminUser.id,
      },
      {
        projectId: project1.id,
        amount: 20000,
        paymentDate: new Date('2026-03-28T14:30:00Z'),
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'WIRE-ACME-884920',
        notes: 'Second milestone installment received',
        createdById: superAdminUser.id,
      },
    ],
  });

  // 3. Project 1 Expenses (Total: 9,000 INR)
  await prisma.projectExpense.createMany({
    data: [
      {
        projectId: project1.id,
        category: 'DEVELOPER_PAYMENT',
        userId: developerUser.id,
        amount: 5000,
        paymentDate: new Date('2026-03-20T00:00:00Z'),
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/DEV/88391',
        description: 'Frontend and API integration payment to John Doe',
        createdById: superAdminUser.id,
      },
      {
        projectId: project1.id,
        category: 'DESIGNER_PAYMENT',
        userId: designerUser.id,
        amount: 3000,
        paymentDate: new Date('2026-03-22T00:00:00Z'),
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/DES/77219',
        description: 'UI/UX wireframes and prototype payment to Elena',
        createdById: superAdminUser.id,
      },
      {
        projectId: project1.id,
        category: 'INFRASTRUCTURE',
        amount: 1000,
        paymentDate: new Date('2026-03-25T00:00:00Z'),
        paymentMethod: 'CREDIT_CARD',
        referenceNumber: 'AWS-INV-99210',
        description: 'Cloud hosting server staging environment setup',
        createdById: superAdminUser.id,
      },
    ],
  });

  console.log('✅ Seed completed successfully for Phase 1, Phase 2, Phase 3, Phase 4 & Phase 5!');
  console.log('----------------------------------------------------');
  console.log('Default Credentials:');
  console.log(`  Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`  Admin:       admin.user@pmp.local / Admin123!`);
  console.log(`  User (Dev):  john.doe@pmp.local / User123!`);
  console.log(`  User (Des):  elena.rostova@pmp.local / User123!`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
