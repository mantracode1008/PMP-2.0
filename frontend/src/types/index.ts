export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type GeneralStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ProjectStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';
export type ProjectHealth = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
export type ProjectMemberRole = 'MANAGER' | 'MEMBER' | 'VIEWER';
export type TeamMemberRole = 'LEAD' | 'MEMBER' | 'CONTRIBUTOR';

// Phase 2 Types
export type MilestoneStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'COMPLETED'
  | 'DELAYED';

export type TaskStatus =
  | 'BACKLOG'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'QA'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type DependencyType = 'BLOCKS' | 'BLOCKED_BY' | 'DEPENDS_ON' | 'RELATED_TO';

export type DocumentEntityType = 'PROJECT' | 'TASK';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  status: UserStatus;
  departmentId?: string | null;
  department?: Department | null;
  roles?: Role[];
  permissions?: string[];
  projects?: { id: string; name: string; code: string; role: ProjectMemberRole }[];
  teams?: { id: string; name: string; role: TeamMemberRole }[];
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  isSystem: boolean;
  rolePermissions?: { permission: Permission }[];
  _count?: { userRoles: number };
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  status: GeneralStatus;
  userCount?: number;
  teamCount?: number;
  users?: User[];
  teams?: Team[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  status: GeneralStatus;
  departmentId?: string | null;
  department?: Department | null;
  teamLeadId?: string | null;
  teamLead?: User | null;
  memberCount?: number;
  members?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  joinedAt: string;
  user: User;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  status: GeneralStatus;
  projectCount?: number;
  projects?: Project[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  health: ProjectHealth;
  clientId: string;
  client?: { id: string; name: string; companyName: string; email?: string | null };
  ownerId: string;
  owner?: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
  startDate?: string | null;
  targetDate?: string | null;
  actualEndDate?: string | null;
  memberCount?: number;
  members?: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectMemberRole;
  joinedAt: string;
  user: User;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  status: MilestoneStatus;
  startDate?: string | null;
  dueDate?: string | null;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  taskCount?: number;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: DependencyType;
  dependsOnTask?: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  entityType: DocumentEntityType;
  projectId: string;
  taskId?: string | null;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  project?: { id: string; name: string; code: string };
  milestoneId?: string | null;
  milestone?: { id: string; name: string; status?: MilestoneStatus } | null;
  parentTaskId?: string | null;
  parentTask?: { id: string; taskNumber: number; title: string } | null;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  progress: number;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
  assignees?: TaskAssignee[];
  subtasks?: Task[];
  dependencies?: TaskDependency[];
  dependedOnBy?: TaskDependency[];
  comments?: TaskComment[];
  attachments?: DocumentItem[];
  subtaskCount?: number;
  commentCount?: number;
  attachmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  ipAddress?: string | null;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface MyWorkMetrics {
  totalAssigned: number;
  overdueCount: number;
  todayCount: number;
  inProgressCount: number;
  waitingReviewCount: number;
  completedCount: number;
}

export interface MyWorkGroups {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  inProgress: Task[];
  waitingReview: Task[];
  completed: Task[];
}

export interface MyWorkData {
  metrics: MyWorkMetrics;
  groups: MyWorkGroups;
  allTasks: Task[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ActivityLog = ActivityLogItem;

// ==========================================
// PHASE 3 TYPES: Time & Resource Management
// ==========================================

export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'LOCKED';
export type WorkloadStatus = 'AVAILABLE' | 'HEALTHY' | 'NEAR_CAPACITY' | 'OVERLOADED';

export interface WorkLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  projectId: string;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  taskId: string;
  task?: {
    id: string;
    taskNumber: number;
    title: string;
    estimatedHours?: number | null;
    status: TaskStatus;
  };
  timesheetId?: string | null;
  date: string;
  durationMinutes: number;
  description?: string | null;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTimeSummary {
  taskId: string;
  estimatedHours: number;
  loggedMinutes: number;
  loggedHours: number;
  remainingHours: number;
  overEstimateHours: number;
  isOverEstimate: boolean;
}

export interface Timesheet {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  submittedAt?: string | null;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  totalMinutes?: number;
  totalHours?: number;
  workLogCount?: number;
  workLogs?: WorkLog[];
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetTaskRow {
  task: {
    id: string;
    taskNumber: number;
    title: string;
    status: TaskStatus;
    estimatedHours?: number | null;
  };
  project: {
    id: string;
    name: string;
    code: string;
  };
  days: {
    [dayIndex: number]: {
      durationMinutes: number;
      logIds: string[];
    };
  };
  totalMinutes: number;
  totalHours: number;
}

export interface WeeklyTimesheetGrid {
  timesheet: Timesheet & { weeklyTotalMinutes: number; weeklyTotalHours: number };
  dailyTotals: {
    monday: { minutes: number; hours: number };
    tuesday: { minutes: number; hours: number };
    wednesday: { minutes: number; hours: number };
    thursday: { minutes: number; hours: number };
    friday: { minutes: number; hours: number };
    saturday: { minutes: number; hours: number };
    sunday: { minutes: number; hours: number };
  };
  taskRows: TimesheetTaskRow[];
  rawWorkLogs: WorkLog[];
}

export interface UserCapacity {
  id: string;
  userId: string;
  dailyCapacityMinutes: number;
  dailyCapacityHours: number;
  weeklyCapacityMinutes: number;
  weeklyCapacityHours: number;
  workingDays: number[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WorkloadUser {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    department?: { id: string; name: string } | null;
    teams?: { id: string; name: string }[];
  };
  capacity: {
    dailyCapacityMinutes: number;
    dailyCapacityHours: number;
    weeklyCapacityMinutes: number;
    weeklyCapacityHours: number;
    workingDays: number[];
  };
  assignedEstimatedHours: number;
  actualLoggedMinutes: number;
  actualLoggedHours: number;
  openTasksCount: number;
  overdueTasksCount: number;
  utilization: number;
  status: WorkloadStatus;
}

export interface WorkloadSummary {
  totalUsers: number;
  totalCapacityHours: number;
  totalAssignedHours: number;
  totalLoggedHours: number;
  averageUtilization: number;
  overloadedCount: number;
  nearCapacityCount: number;
  healthyCount: number;
  availableCount: number;
}

export interface WorkloadData {
  summary: WorkloadSummary;
  users: WorkloadUser[];
}

export interface ProjectProgressSnapshot {
  progress: number;
  recordedAt: string;
  totalEstimatedHours: number | null;
  totalActualHours: number;
}

export interface ProjectMilestoneProgress {
  id: string;
  name: string;
  status: MilestoneStatus;
  startDate?: string | null;
  dueDate?: string | null;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export interface ProjectProgressData {
  projectId: string;
  projectName: string;
  projectCode: string;
  health: ProjectHealth;
  status: ProjectStatus;
  overallProgress: number;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    totalEstimatedHours: number;
    totalActualMinutes: number;
    totalActualHours: number;
  };
  milestones: ProjectMilestoneProgress[];
  history: ProjectProgressSnapshot[];
}

export interface TimelineSubtask {
  id: string;
  taskNumber: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate?: string | null;
  dueDate?: string | null;
  assignees: { id: string; firstName: string; lastName: string; avatarUrl?: string | null }[];
}

export interface TimelineTask {
  id: string;
  taskNumber: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate?: string | null;
  dueDate?: string | null;
  durationDays: number;
  estimatedHours?: number | null;
  assignees: { id: string; firstName: string; lastName: string; avatarUrl?: string | null }[];
  dependencies: {
    type: DependencyType;
    dependsOnTaskId: string;
    dependsOnTaskNumber: number;
    dependsOnTitle: string;
  }[];
  blocking: {
    blockedTaskId: string;
    blockedTaskNumber: number;
    blockedTitle: string;
  }[];
  subtasks: TimelineSubtask[];
}

export interface TimelineMilestone {
  type: 'MILESTONE';
  id: string;
  name: string;
  status: MilestoneStatus;
  startDate?: string | null;
  dueDate?: string | null;
  durationDays: number;
  progress: number;
  tasks: TimelineTask[];
}

export interface ProjectTimelineData {
  project: {
    id: string;
    name: string;
    code: string;
    startDate?: string | null;
    targetDate?: string | null;
  };
  tree: TimelineMilestone[];
}

export interface CalendarEvent {
  id: string;
  entityType: 'TASK' | 'MILESTONE';
  taskNumber?: number;
  title: string;
  startDate?: string | null;
  dueDate?: string | null;
  status: string;
  priority?: TaskPriority;
  progress?: number;
  milestone?: { id: string; name: string } | null;
  assignees?: { id: string; firstName: string; lastName: string; avatarUrl?: string | null }[];
  isMilestone: boolean;
}

export interface ProjectTimeSummary {
  projectId: string;
  projectName: string;
  projectCode: string;
  totalEstimatedHours: number;
  totalActualMinutes: number;
  totalActualHours: number;
  remainingEstimatedHours: number;
  overEstimateTasksCount: number;
  overEstimateTasks: {
    id: string;
    taskNumber: number;
    title: string;
    estimatedHours: number;
    loggedHours: number;
    overHours: number;
  }[];
}

export interface DeadlineData {
  metrics: {
    totalOpenTasks: number;
    overdueCount: number;
    dueTodayCount: number;
    dueSoonCount: number;
    noDueDateCount: number;
  };
  overdue: Task[];
  dueToday: Task[];
  dueSoon: Task[];
  noDueDate: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  meta?: PaginatedMeta;
  timestamp: string;
}
