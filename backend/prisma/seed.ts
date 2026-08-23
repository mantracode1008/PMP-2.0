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

  // Admin gets all except deep role governance
  const adminPermissions = PERMISSIONS.filter((p) => p.code !== 'roles.manage');
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

  console.log('✅ Seed completed successfully for Phase 1 & Phase 2!');
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
