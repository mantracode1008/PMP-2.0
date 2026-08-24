'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api';
import { useAuth } from '../../../../features/auth/auth-context';
import { PageHeader } from '../../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/shared/status-badge';
import { Dialog } from '../../../../components/ui/dialog';
import { ConfirmDialog } from '../../../../components/shared/confirm-dialog';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../components/ui/toast';
import { formatDate, getInitials } from '../../../../lib/utils';
import {
  Building2,
  Calendar,
  User,
  Users,
  Plus,
  Trash2,
  Edit2,
  Archive,
  LayoutGrid,
  ListTodo,
  Kanban,
  Flag,
  Files,
  Activity,
  DollarSign,
} from 'lucide-react';
import {
  ApiResponse,
  Milestone,
  Project,
  ProjectHealth,
  ProjectMemberRole,
  ProjectStatus,
  Task,
  TaskStatus,
  User as UserType,
  ProjectFinancialResponse,
} from '../../../../types';

// Workspace Features
import { TaskListView } from '../../../../features/tasks/task-list-view';
import { TaskKanbanBoard } from '../../../../features/tasks/task-kanban-board';
import { TaskFormDialog } from '../../../../features/tasks/task-form-dialog';
import { TaskDetailDrawer } from '../../../../features/tasks/task-detail-drawer';
import { MilestoneListView } from '../../../../features/milestones/milestone-list-view';
import { MilestoneFormDialog } from '../../../../features/milestones/milestone-form-dialog';
import { DocumentListView } from '../../../../features/documents/document-list-view';
import { DocumentUploadDialog } from '../../../../features/documents/document-upload-dialog';
import { ActivityTimelineView } from '../../../../features/activity/activity-timeline-view';

// Planning & Time Features
import { GanttChartView } from '../../../../features/planning/gantt-chart-view';
import { ProjectCalendarView } from '../../../../features/planning/project-calendar-view';
import { ProjectTimeSummaryWidget } from '../../../../features/planning/project-time-summary-widget';

// Financial Features
import { ProjectFinancialsTab } from '../../../../features/finance';

type WorkspaceTab =
  | 'overview'
  | 'tasks'
  | 'board'
  | 'timeline'
  | 'milestones'
  | 'financials'
  | 'documents';

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, hasPermission, isSuperAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('tasks');

  // Modals & Drawers
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Task Drawer & Dialog states
  const [selectedDrawerTaskId, setSelectedDrawerTaskId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('TODO');

  // Milestone Dialog states
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [milestoneToEdit, setMilestoneToEdit] = useState<Milestone | null>(null);

  // Document Upload states
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);

  // Task filters
  const [taskPage, setTaskPage] = useState(1);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskMilestoneFilter, setTaskMilestoneFilter] = useState('');

  // Project Edit states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('PLANNING');
  const [editHealth, setEditHealth] = useState<ProjectHealth>('HEALTHY');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Add member states
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>('MEMBER');

  const canUpdate = hasPermission('projects.update');
  const canManageMembers = hasPermission('projects.manage_members');
  const canDelete = hasPermission('projects.delete');
  const canCreateTask = hasPermission('tasks.create');
  const canArchive = hasPermission('projects.archive');

  // Project query
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      const data = res.data.data;
      setEditName(data.name);
      setEditDescription(data.description || '');
      setEditStatus(data.status);
      setEditHealth(data.health);
      setEditStartDate(data.startDate ? data.startDate.split('T')[0] : '');
      setEditTargetDate(data.targetDate ? data.targetDate.split('T')[0] : '');
      return data;
    },
  });

  // Financials Queries (Super Admin / authorized only)
  const canAccessFinancials = isSuperAdmin || hasPermission('finance.read');
  const canManageFinancials = isSuperAdmin || hasPermission('finance.manage');

  const { data: projectFinancialsData, isLoading: isFinancialsLoading } = useQuery({
    queryKey: ['project-financials', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProjectFinancialResponse>>(`/projects/${id}/financials`);
      return res.data.data;
    },
    enabled: !!id && canAccessFinancials && activeTab === 'financials',
  });

  const handleSetProjectValue = async (data: {
    projectValue: number;
    currency: string;
    nextPaymentDueDate?: string | null;
    nextPaymentAmount?: number | null;
    paymentReminderNotes?: string | null;
  }) => {
    await api.post(`/projects/${id}/financials`, data);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    queryClient.invalidateQueries({ queryKey: ['payment-reminders'] });
    queryClient.invalidateQueries({ queryKey: ['header-payment-reminders'] });
    showToast('Success', 'Project financial settings & reminder updated.', 'success');
  };

  const handleAddPayment = async (data: any) => {
    await api.post(`/projects/${id}/payments`, data);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Client payment recorded successfully.', 'success');
  };

  const handleUpdatePayment = async (paymentId: string, data: any) => {
    await api.patch(`/projects/${id}/payments/${paymentId}`, data);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Client payment updated.', 'success');
  };

  const handleDeletePayment = async (paymentId: string) => {
    await api.delete(`/projects/${id}/payments/${paymentId}`);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Client payment deleted.', 'success');
  };

  const handleAddExpense = async (data: any) => {
    await api.post(`/projects/${id}/expenses`, data);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Project expense recorded.', 'success');
  };

  const handleUpdateExpense = async (expenseId: string, data: any) => {
    await api.patch(`/projects/${id}/expenses/${expenseId}`, data);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Project expense updated.', 'success');
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await api.delete(`/projects/${id}/expenses/${expenseId}`);
    queryClient.invalidateQueries({ queryKey: ['project-financials', id] });
    showToast('Success', 'Project expense deleted.', 'success');
  };

  // Tasks query
  const { data: tasksData, isLoading: isTasksLoading } = useQuery({
    queryKey: ['tasks', id, taskPage, taskSearch, taskStatusFilter, taskPriorityFilter, taskMilestoneFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(taskPage));
      params.set('limit', '50');
      if (taskSearch) params.set('search', taskSearch);
      if (taskStatusFilter) params.set('status', taskStatusFilter);
      if (taskPriorityFilter) params.set('priority', taskPriorityFilter);
      if (taskMilestoneFilter) params.set('milestoneId', taskMilestoneFilter);

      const res = await api.get<ApiResponse<Task[]>>(`/projects/${id}/tasks?${params.toString()}`);
      return res.data;
    },
  });

  // Milestones query
  const { data: milestonesData, isLoading: isMilestonesLoading } = useQuery({
    queryKey: ['milestones', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Milestone[]>>(`/projects/${id}/milestones`);
      return res.data.data;
    },
  });

  // Documents query
  const { data: documentsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any[]>>(`/projects/${id}/documents`);
      return res.data.data;
    },
  });

  // All Users query
  const { data: allUsers } = useQuery({
    queryKey: ['users-for-members'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserType[]>>('/users?limit=100');
      return res.data.data;
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/projects/${id}`, {
        name: editName,
        description: editDescription || undefined,
        status: editStatus,
        health: editHealth,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        targetDate: editTargetDate ? new Date(editTargetDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsEditOpen(false);
      showToast('Success', 'Project details updated.', 'success');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update project.', 'error');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/projects/${id}/members`, {
        userId: newMemberId,
        projectRole: newMemberRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsAddMemberOpen(false);
      setNewMemberId('');
      showToast('Success', 'Team member assigned.', 'success');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to assign member.', 'error');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.delete(`/projects/${id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setMemberToRemove(null);
      showToast('Success', 'Member unassigned.', 'success');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to remove member.', 'error');
    },
  });

  const handleArchiveProject = async () => {
    try {
      await api.post(`/projects/${id}/archive`, { reason: 'Archived from project workspace', policy: 'ALLOW' });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Success', 'Project archived and locked in read-only mode.', 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to archive project.', 'error');
    }
  };

  const handleRestoreProject = async () => {
    await api.post(`/projects/${id}/restore`);
    queryClient.invalidateQueries({ queryKey: ['project', id] });
    showToast('Success', 'Project restored to active state.', 'success');
  };

  if (isLoading || !project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const existingMemberIds = new Set(project.members?.map((m) => m.user.id) || []);
  const availableUsers = allUsers?.filter((u) => !existingMemberIds.has(u.id)) || [];

  const handleOpenCreateTask = (defaultStatus: TaskStatus = 'TODO') => {
    setTaskToEdit(null);
    setDefaultTaskStatus(defaultStatus);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleOpenCreateMilestone = () => {
    setMilestoneToEdit(null);
    setIsMilestoneFormOpen(true);
  };

  const handleOpenEditMilestone = (m: Milestone) => {
    setMilestoneToEdit(m);
    setIsMilestoneFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Archive Notification Banner */}
      {project.status === 'ARCHIVED' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-center justify-between shadow-2xs">
          <div>
            <span className="font-bold">Project Archived</span>
            <p className="text-xs text-amber-700 mt-0.5">
              This project is currently locked in read-only archive mode.
            </p>
          </div>
          {canArchive && (
            <Button size="sm" variant="outline" onClick={handleRestoreProject} className="border-amber-300 hover:bg-amber-100">
              Restore Project
            </Button>
          )}
        </div>
      )}

      {/* Workspace Header */}
      <PageHeader
        title={project.name}
        description={`Workspace: ${project.code} • Client: ${project.client?.companyName || '—'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/projects' },
          { label: project.code },
        ]}
        action={
          <div className="flex items-center gap-2">
            {project.status !== 'ARCHIVED' && canCreateTask && (
              <Button size="sm" onClick={() => handleOpenCreateTask()}>
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
            )}
            {project.status !== 'ARCHIVED' && canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Project
              </Button>
            )}
            {project.status !== 'ARCHIVED' && canArchive && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={handleArchiveProject}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive Project
              </Button>
            )}
          </div>
        }
      />

      {/* Quick Summary Pill Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Status</span>
            <StatusBadge status={project.status} type="project" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Health</span>
            <StatusBadge status={project.health} type="health" />
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">Target: {formatDate(project.targetDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              Lead: {project.owner?.firstName} {project.owner?.lastName}
            </span>
          </div>
        </div>

        {/* Members Pile */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            {project.members?.slice(0, 5).map((m) => (
              <span
                key={m.id}
                title={`${m.user.firstName} ${m.user.lastName} (${m.projectRole})`}
                className="inline-flex h-6 w-6 rounded-full ring-2 ring-white bg-indigo-100 text-indigo-700 text-[10px] font-bold items-center justify-center"
              >
                {getInitials(m.user.firstName, m.user.lastName)}
              </span>
            ))}
          </div>
          {project.status !== 'ARCHIVED' && canManageMembers && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => setIsAddMemberOpen(true)}
            >
              + Member
            </Button>
          )}
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'tasks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Tasks List ({tasksData?.meta?.total ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'board'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Kanban className="h-4 w-4" />
          Kanban Board
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'timeline'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Gantt & Timeline
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'milestones'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Flag className="h-4 w-4" />
          Milestones ({milestonesData?.length || 0})
        </button>

        {canAccessFinancials && (
          <button
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
              activeTab === 'financials'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Financials
          </button>
        )}

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'documents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Files className="h-4 w-4" />
          Documents ({documentsData?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          Project Overview
        </button>
      </div>

      {/* 1. Tasks List Tab */}
      {activeTab === 'tasks' && (
        <TaskListView
          projectId={id}
          tasks={tasksData?.data || []}
          meta={tasksData?.meta}
          isLoading={isTasksLoading}
          page={taskPage}
          search={taskSearch}
          statusFilter={taskStatusFilter}
          onStatusFilterChange={(val) => {
            setTaskStatusFilter(val);
            setTaskPage(1);
          }}
          priorityFilter={taskPriorityFilter}
          onPriorityFilterChange={(val) => {
            setTaskPriorityFilter(val);
            setTaskPage(1);
          }}
          milestoneFilter={taskMilestoneFilter}
          onMilestoneFilterChange={(val) => {
            setTaskMilestoneFilter(val);
            setTaskPage(1);
          }}
          onSearchChange={(val) => {
            setTaskSearch(val);
            setTaskPage(1);
          }}
          onPageChange={setTaskPage}
          onTaskClick={(t) => setSelectedDrawerTaskId(t.id)}
          onAddTask={() => handleOpenCreateTask()}
          milestones={milestonesData || []}
        />
      )}

      {/* 2. Kanban Board Tab */}
      {activeTab === 'board' && (
        <TaskKanbanBoard
          tasks={tasksData?.data || []}
          projectId={id}
          onTaskClick={(t) => setSelectedDrawerTaskId(t.id)}
          onAddTask={(status) => handleOpenCreateTask(status)}
        />
      )}

      {/* 3. Gantt & Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <GanttChartView
            projectId={id}
            onSelectTask={(taskId) => setSelectedDrawerTaskId(taskId)}
          />
          <ProjectTimeSummaryWidget projectId={id} />
        </div>
      )}

      {/* 4. Financials Tab (Super Admin / authorized) */}
      {activeTab === 'financials' && canAccessFinancials && (
        isFinancialsLoading || !projectFinancialsData ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <ProjectFinancialsTab
            financialData={projectFinancialsData}
            teamMembers={
              project?.members?.map((m: any) => ({
                id: m.user.id,
                name: `${m.user.firstName} ${m.user.lastName}`,
                email: m.user.email,
              })) || []
            }
            onSetProjectValue={handleSetProjectValue}
            onAddPayment={handleAddPayment}
            onUpdatePayment={handleUpdatePayment}
            onDeletePayment={handleDeletePayment}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            canManage={canManageFinancials}
          />
        )
      )}

      {/* 5. Milestones Tab */}
      {activeTab === 'milestones' && (
        <MilestoneListView
          milestones={milestonesData || []}
          projectId={id}
          isLoading={isMilestonesLoading}
          onAddMilestone={handleOpenCreateMilestone}
          onEditMilestone={handleOpenEditMilestone}
        />
      )}

      {/* 6. Documents Tab */}
      {activeTab === 'documents' && (
        <DocumentListView
          documents={documentsData || []}
          projectId={id}
          isLoading={isDocsLoading}
          onUploadDocument={() => setIsDocUploadOpen(true)}
        />
      )}

      {/* 7. Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope & Deliverables</CardTitle>
                <CardDescription>Project mandate and operational scope</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {project.description || 'No detailed scope provided.'}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Kickoff Start Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(project.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Target Completion Date</span>
                    <span className="font-semibold text-slate-800">{formatDate(project.targetDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.client && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Client Organization</CardTitle>
                    <CardDescription>Account commissioning this engagement</CardDescription>
                  </div>
                  <Building2 className="h-5 w-5 text-slate-400" />
                </CardHeader>
                <CardContent className="space-y-2 text-sm pt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Company Name</span>
                    <span className="font-semibold text-slate-900">{project.client.companyName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Primary Contact</span>
                    <span className="font-medium text-slate-800">{project.client.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Contact Email</span>
                    <span className="font-medium text-indigo-600">{project.client.email}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Project Team</CardTitle>
                  <CardDescription>{project.members?.length || 0} assigned members</CardDescription>
                </div>
                {project.status !== 'ARCHIVED' && canManageMembers && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setIsAddMemberOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {project.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {getInitials(member.user.firstName, member.user.lastName, member.user.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {member.user.firstName} {member.user.lastName}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400">
                          {member.projectRole}
                        </span>
                      </div>
                    </div>

                    {project.status !== 'ARCHIVED' && canManageMembers && project.ownerId !== member.user.id && (
                      <button
                        onClick={() => setMemberToRemove(member.user.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedDrawerTaskId}
        onClose={() => setSelectedDrawerTaskId(null)}
        onEditTask={handleOpenEditTask}
      />

      {/* Task Creation & Edit Modal */}
      <TaskFormDialog
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setTaskToEdit(null);
        }}
        projectId={id}
        taskToEdit={taskToEdit}
        defaultStatus={defaultTaskStatus}
      />

      {/* Milestone Form Dialog */}
      <MilestoneFormDialog
        isOpen={isMilestoneFormOpen}
        onClose={() => {
          setIsMilestoneFormOpen(false);
          setMilestoneToEdit(null);
        }}
        projectId={id}
        milestoneToEdit={milestoneToEdit}
      />

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        isOpen={isDocUploadOpen}
        onClose={() => setIsDocUploadOpen(false)}
        projectId={id}
      />

      {/* Edit Project Modal */}
      <Dialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project Details"
        description="Update project name, timeline, lifecycle status, and operational health."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Health</label>
              <Select value={editHealth} onChange={(e) => setEditHealth(e.target.value as ProjectHealth)}>
                <option value="HEALTHY">Healthy</option>
                <option value="AT_RISK">At Risk</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
              <Input
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Assign Team Member"
        description="Add a staff member to this project and define their operational role."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMemberId) {
              showToast('Error', 'Please select a user to add.', 'error');
              return;
            }
            addMemberMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select User *</label>
            <Select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} required>
              <option value="">Select staff member...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Role</label>
            <Select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value as ProjectMemberRole)}>
              <option value="LEAD">Project Lead</option>
              <option value="MEMBER">Team Member</option>
              <option value="VIEWER">Viewer (Read-only)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addMemberMutation.isPending}>
              Assign Member
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (memberToRemove) {
            removeMemberMutation.mutate(memberToRemove);
          }
        }}
        title="Unassign Team Member"
        description="Are you sure you want to remove this user from the project? They will lose workspace edit access."
        confirmLabel="Remove Member"
        isDestructive={true}
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
