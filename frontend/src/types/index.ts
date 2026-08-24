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

// ====================================================
// PHASE 4 TYPES: Advanced Project Governance
// ====================================================

export type RiskProbability = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type RiskImpact = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskStatus = 'OPEN' | 'MONITORING' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';
export type RiskCategory =
  | 'TECHNICAL'
  | 'SCHEDULE'
  | 'RESOURCE'
  | 'BUDGET'
  | 'OPERATIONAL'
  | 'EXTERNAL'
  | 'OTHER';

export interface Risk {
  id: string;
  projectId: string;
  riskNumber: number;
  title: string;
  description?: string | null;
  category: RiskCategory;
  status: RiskStatus;
  probability: RiskProbability;
  impact: RiskImpact;
  riskScore: number;
  ownerId: string;
  owner?: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
  identifiedDate: string;
  reviewDate?: string | null;
  mitigationPlan?: string | null;
  contingencyPlan?: string | null;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  issues?: Issue[];
  attachments?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskMatrixCell {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number;
  risks: Risk[];
}

export interface RiskMatrixData {
  matrix: Record<string, Record<string, RiskMatrixCell>>;
  summary: {
    totalRisks: number;
    openRisks: number;
    highRisks: number;
    mitigatedRisks: number;
    closedRisks: number;
  };
}

export type IssueType =
  | 'TECHNICAL'
  | 'BLOCKER'
  | 'DEPENDENCY'
  | 'RESOURCE'
  | 'SCOPE'
  | 'QUALITY'
  | 'OTHER';
export type IssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Issue {
  id: string;
  projectId: string;
  issueNumber: number;
  title: string;
  description?: string | null;
  type: IssueType;
  severity: IssueSeverity;
  priority: IssuePriority;
  status: IssueStatus;
  reportedById: string;
  reportedBy?: { id: string; firstName: string; lastName: string; email: string };
  ownerId?: string | null;
  owner?: { id: string; firstName: string; lastName: string; email?: string; avatarUrl?: string | null } | null;
  milestoneId?: string | null;
  milestone?: { id: string; name: string } | null;
  taskId?: string | null;
  task?: { id: string; taskNumber: number; title: string } | null;
  riskId?: string | null;
  risk?: { id: string; riskNumber: number; title: string } | null;
  reportedDate: string;
  dueDate?: string | null;
  resolvedDate?: string | null;
  resolution?: string | null;
  attachments?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthDimension {
  status: ProjectHealth;
  score: number;
  summary: string;
  details: Record<string, any>;
}

export interface ProjectHealthReport {
  projectId: string;
  projectName: string;
  projectCode: string;
  overallHealth: ProjectHealth;
  calculatedHealth: ProjectHealth;
  isOverridden: boolean;
  overrideDetails?: {
    reason: string | null;
    overriddenBy: { id: string; firstName: string; lastName: string } | null;
    overriddenAt: string | null;
  };
  dimensions: {
    schedule: HealthDimension;
    scope: HealthDimension;
    resources: HealthDimension;
    risks: HealthDimension;
    issues: HealthDimension;
  };
  calculatedAt: string;
}

export type ChangeRequestType =
  | 'SCOPE'
  | 'SCHEDULE'
  | 'RESOURCE'
  | 'TECHNICAL'
  | 'REQUIREMENT'
  | 'OTHER';

export type ChangeRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED'
  | 'CANCELLED';

export interface ChangeRequest {
  id: string;
  projectId: string;
  requestNumber: number;
  title: string;
  description: string;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  reason: string;
  impactSummary?: string | null;
  scheduleImpactDays?: number | null;
  costImpact?: string | null;
  resourceImpact?: string | null;
  scopeImpact?: string | null;
  riskImpact?: string | null;
  requestedById: string;
  requestedBy?: { id: string; firstName: string; lastName: string; email?: string; avatarUrl?: string | null };
  requestedAt: string;
  approvedById?: string | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedBy?: { id: string; firstName: string; lastName: string } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  approvalRequests?: ApprovalRequest[];
  attachments?: Document[];
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalEntityType = 'CHANGE_REQUEST' | 'TIMESHEET' | 'PROJECT_CLOSURE';

export interface ApprovalStep {
  id: string;
  approvalRequestId: string;
  stepOrder: number;
  approverRoleId?: string | null;
  approverUserId?: string | null;
  approverUser?: { id: string; firstName: string; lastName: string; email: string } | null;
  status: ApprovalStatus;
  actionById?: string | null;
  actionBy?: { id: string; firstName: string; lastName: string } | null;
  actionAt?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  projectId?: string | null;
  project?: { id: string; name: string; code: string } | null;
  changeRequestId?: string | null;
  changeRequest?: ChangeRequest | null;
  requestedById: string;
  requestedBy?: { id: string; firstName: string; lastName: string; email: string; avatarUrl?: string | null };
  status: ApprovalStatus;
  currentStep: number;
  totalSteps: number;
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplate {
  id: string;
  templateId?: string | null;
  milestoneTemplateId?: string | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  estimatedHours?: number | null;
  defaultRole?: string | null;
  orderIndex: number;
  targetDayOffset: number;
  checklist?: string[] | null;
  isStandalone: boolean;
  createdAt?: string;
}

export interface MilestoneTemplate {
  id: string;
  templateId: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  targetDayOffset: number;
  tasks: TaskTemplate[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  estimatedDurationDays: number;
  defaultRoles: string[];
  isSystem: boolean;
  milestones?: MilestoneTemplate[];
  tasks?: TaskTemplate[];
  createdBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface RecurringTaskDefinition {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  estimatedHours?: number | null;
  milestoneId?: string | null;
  milestone?: { id: string; name: string } | null;
  assigneeIds: string[];
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: number[];
  dayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  nextRunDate: string;
  lastGeneratedDate?: string | null;
  isActive: boolean;
  timezone: string;
  createdBy?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBaselineSnapshot {
  id: string;
  baselineId: string;
  totalTasks: number;
  totalMilestones: number;
  totalEstimatedHours: number;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  snapshotData: Record<string, any>;
  createdAt: string;
}

export interface ProjectBaseline {
  id: string;
  projectId: string;
  baselineNumber: number;
  name: string;
  description?: string | null;
  createdById: string;
  createdBy?: { id: string; firstName: string; lastName: string; email?: string };
  snapshot?: ProjectBaselineSnapshot | null;
  createdAt: string;
}

export interface BaselineComparisonData {
  baseline: {
    id: string;
    number: number;
    name: string;
    createdAt: string;
    plannedStartDate?: string | null;
    plannedEndDate?: string | null;
    estimatedHours: number;
    totalTasks: number;
    totalMilestones: number;
  };
  current: {
    startDate?: string | null;
    targetDate?: string | null;
    estimatedHours: number;
    totalTasks: number;
    totalMilestones: number;
  };
  variance: {
    scheduleVarianceDays: number;
    effortVarianceHours: number;
    taskCountVariance: number;
    milestoneCountVariance: number;
  };
}

export interface ProjectClosureCheckResult {
  projectId: string;
  projectName: string;
  canArchive: boolean;
  blockersCount: number;
  warningsCount: number;
  checks: {
    uncompletedTasks: { passed: boolean; count: number; items: { id: string; title: string; status: string }[] };
    criticalIssues: { passed: boolean; count: number; items: { id: string; title: string; severity: string }[] };
    pendingApprovals: { passed: boolean; count: number; items: { id: string; entityType: string; status: string }[] };
    openHighRisks: { passed: boolean; count: number; items: { id: string; title: string; score: number }[] };
    unsubmittedTimesheets: { passed: boolean; count: number; items: { id: string; user: string; status: string }[] };
  };
}

// =========================================================================
// Phase 5 Project Financial Management Types (SUPER ADMIN ONLY)
// =========================================================================

export type ExpenseCategory =
  | 'TEAM_MEMBER_PAYMENT'
  | 'FREELANCER_PAYMENT'
  | 'DESIGNER_PAYMENT'
  | 'DEVELOPER_PAYMENT'
  | 'SOFTWARE_TOOLS'
  | 'INFRASTRUCTURE'
  | 'MARKETING'
  | 'OTHER';

export type PaymentMethod =
  | 'UPI'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'CHEQUE'
  | 'OTHER';

export interface ProjectFinancial {
  id: string;
  projectId: string;
  currency: string;
  projectValue: number;
  nextPaymentDueDate?: string | null;
  nextPaymentAmount?: number | null;
  paymentReminderNotes?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ClientPayment {
  id: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: ExpenseCategory;
  userId?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  description: string;
  receiptUrl?: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectFinancialMetrics {
  currency: string;
  projectValue: number;
  totalReceived: number;
  remainingAmount: number;
  totalExpenses: number;
  currentCashPosition: number;
  expectedProfit: number;
  totalTeamMemberPayments: number;
  isFullyPaid: boolean;
}

export interface ProjectFinancialResponse {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectStatus: ProjectStatus;
  client?: {
    id: string;
    name: string;
    companyName: string;
  } | null;
  financialSettings?: ProjectFinancial | null;
  metrics: ProjectFinancialMetrics;
  clientPayments: ClientPayment[];
  projectExpenses: ProjectExpense[];
}

export interface GlobalFinancialMetrics {
  totalProjectValue: number;
  totalReceived: number;
  totalPending: number;
  totalExpenses: number;
  totalCashPosition: number;
  totalExpectedProfit: number;
  totalProjects: number;
  projectsWithFinances: number;
}

export interface ProjectFinancialSummaryRow {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  client?: {
    id: string;
    name: string;
    companyName: string;
  } | null;
  currency: string;
  projectValue: number;
  received: number;
  pending: number;
  expenses: number;
  currentCash: number;
  expectedProfit: number;
  nextPaymentDueDate?: string | null;
  nextPaymentAmount?: number | null;
  paymentReminderNotes?: string | null;
  paymentCount: number;
  expenseCount: number;
  isFullyPaid: boolean;
}

export interface PaymentReminderItem {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectStatus: ProjectStatus;
  client: {
    id: string;
    name: string;
    companyName: string;
    email: string;
    phone?: string | null;
  } | null;
  currency: string;
  projectValue: number;
  received: number;
  pending: number;
  nextPaymentDueDate: string;
  nextPaymentAmount: number | null;
  paymentReminderNotes: string | null;
  urgencyStatus: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  daysRemaining: number;
}

export interface PaymentRemindersSummary {
  totalReminders: number;
  overdueCount: number;
  dueTodayCount: number;
  dueSoonCount: number;
  totalAmountDue: number;
}

export interface PaymentRemindersResponse {
  summary: PaymentRemindersSummary;
  reminders: PaymentReminderItem[];
}

export interface FinanceDashboardResponse {
  metrics: GlobalFinancialMetrics;
  paymentRemindersSummary?: PaymentRemindersSummary;
  urgentPaymentReminders?: PaymentReminderItem[];
  projects: ProjectFinancialSummaryRow[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface TeamMemberPaymentBreakdown {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  totalPaid: number;
  expenseCount: number;
  projects: {
    projectId: string;
    projectCode: string;
    projectName: string;
    totalAmount: number;
    expenseCount: number;
    lastPaymentDate: string;
  }[];
}

export interface TeamMemberPaymentsResponse {
  grandTotal: number;
  totalMembers: number;
  members: TeamMemberPaymentBreakdown[];
}

export interface FinancialAuditLog {
  id: string;
  actorId: string;
  actor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
  previousValues?: any;
  newValues?: any;
  reason?: string | null;
  createdAt: string;
}


