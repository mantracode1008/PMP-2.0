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
} from 'lucide-react';
import { ApiResponse, Milestone, Project, ProjectHealth, ProjectMemberRole, ProjectStatus, Task, TaskStatus, User as UserType } from '../../../../types';

// Phase 2 Workspace Features
import { TaskListView } from '../../../../features/tasks/task-list-view';
import { TaskKanbanBoard } from '../../../../features/tasks/task-kanban-board';
import { TaskFormDialog } from '../../../../features/tasks/task-form-dialog';
import { TaskDetailDrawer } from '../../../../features/tasks/task-detail-drawer';
import { MilestoneListView } from '../../../../features/milestones/milestone-list-view';
import { MilestoneFormDialog } from '../../../../features/milestones/milestone-form-dialog';
import { DocumentListView } from '../../../../features/documents/document-list-view';
import { DocumentUploadDialog } from '../../../../features/documents/document-upload-dialog';
import { ActivityTimelineView } from '../../../../features/activity/activity-timeline-view';

// Phase 3 Planning & Time Features
import { GanttChartView } from '../../../../features/planning/gantt-chart-view';
import { ProjectCalendarView } from '../../../../features/planning/project-calendar-view';
import { ProjectTimeSummaryWidget } from '../../../../features/planning/project-time-summary-widget';

type WorkspaceTab =
  | 'overview'
  | 'tasks'
  | 'board'
  | 'timeline'
  | 'calendar'
  | 'time-tracking'
  | 'milestones'
  | 'documents'
  | 'activity';

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('tasks');

  // Modals & Drawers
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
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
      const res = await api.get<ApiResponse<Milestone[]>>(`/projects/${id}/milestones?limit=50`);
      return res.data.data;
    },
  });

  // Documents query
  const { data: documentsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>(`/projects/${id}/documents`);
      return res.data.data;
    },
  });

  // Users query for assign member modal
  const { data: allUsers } = useQuery({
    queryKey: ['all-users-assignable'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserType[]>>('/users?limit=100');
      return res.data.data;
    },
    enabled: isAddMemberOpen,
  });

  // Update Project Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/projects/${id}`, {
        name: editName,
        description: editDescription || undefined,
        status: editStatus,
        health: editHealth,
        startDate: editStartDate ? new Date(editStartDate).toISOString() : null,
        targetDate: editTargetDate ? new Date(editTargetDate).toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showToast('Success', 'Project updated successfully.', 'success');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update project.', 'error');
    },
  });

  // Add Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/projects/${id}/members`, {
        userId: newMemberId,
        projectRole: newMemberRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Success', 'Member added to project.', 'success');
      setIsAddMemberOpen(false);
      setNewMemberId('');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to add member.', 'error');
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      showToast('Success', 'Member removed from project.', 'success');
      setMemberToRemove(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to remove member.', 'error');
    },
  });

  // Archive Project Mutation
  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      showToast('Success', 'Project archived.', 'success');
      router.push('/projects');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive project.', 'error');
    },
  });

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
    <div className="space-y-6 animate-in fade-in duration-150">
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
            {canCreateTask && (
              <Button size="sm" onClick={() => handleOpenCreateTask()}>
                <Plus className="mr-1.5 h-4 w-4" /> New Task
              </Button>
            )}
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Project
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsArchiveConfirmOpen(true)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" />
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
          {canManageMembers && (
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
          <Calendar className="h-4 w-4" />
          Timeline & Gantt
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'calendar'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Calendar
        </button>

        <button
          onClick={() => setActiveTab('time-tracking')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'time-tracking'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Time & Progress
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
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'activity'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          Activity Stream
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          Overview & Team
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Tasks List Tab */}
      {activeTab === 'tasks' && (
        <TaskListView
          tasks={tasksData?.data || []}
          meta={tasksData?.meta}
          isLoading={isTasksLoading}
          projectId={id}
          milestones={milestonesData}
          search={taskSearch}
          onSearchChange={(val) => {
            setTaskSearch(val);
            setTaskPage(1);
          }}
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
          page={taskPage}
          onPageChange={setTaskPage}
          onTaskClick={(t) => setSelectedDrawerTaskId(t.id)}
          onAddTask={() => handleOpenCreateTask('TODO')}
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
        <GanttChartView
          projectId={id}
          onSelectTask={(taskId) => setSelectedDrawerTaskId(taskId)}
        />
      )}

      {/* 4. Project Calendar Tab */}
      {activeTab === 'calendar' && (
        <ProjectCalendarView
          projectId={id}
          onSelectTask={(taskId) => setSelectedDrawerTaskId(taskId)}
        />
      )}

      {/* 5. Time & Progress Tracking Tab */}
      {activeTab === 'time-tracking' && (
        <ProjectTimeSummaryWidget projectId={id} />
      )}

      {/* 6. Milestones Tab */}
      {activeTab === 'milestones' && (
        <MilestoneListView
          milestones={milestonesData || []}
          projectId={id}
          isLoading={isMilestonesLoading}
          onAddMilestone={handleOpenCreateMilestone}
          onEditMilestone={handleOpenEditMilestone}
        />
      )}

      {/* 4. Documents Tab */}
      {activeTab === 'documents' && (
        <DocumentListView
          documents={documentsData || []}
          projectId={id}
          isLoading={isDocsLoading}
          onUploadDocument={() => setIsDocUploadOpen(true)}
        />
      )}

      {/* 5. Activity Stream Tab */}
      {activeTab === 'activity' && <ActivityTimelineView projectId={id} />}

      {/* 6. Overview Tab */}
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
                {canManageMembers && (
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
                        <p className="text-[10px] text-slate-400 truncate">{member.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {member.projectRole}
                      </span>
                      {canManageMembers && project.ownerId !== member.user.id && (
                        <button
                          onClick={() => setMemberToRemove(member.user.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project Details" maxWidth="lg">
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
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Health State</label>
              <Select value={editHealth} onChange={(e) => setEditHealth(e.target.value as ProjectHealth)}>
                <option value="HEALTHY">Healthy</option>
                <option value="AT_RISK">At Risk</option>
                <option value="CRITICAL">Critical</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <Input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
              <Input type="date" value={editTargetDate} onChange={(e) => setEditTargetDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Assign Team Member" maxWidth="sm">
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
              <option value="">Choose team member...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role in Project</label>
            <Select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value as ProjectMemberRole)}>
              <option value="MEMBER">Member (Contributor)</option>
              <option value="MANAGER">Manager (Coordinator)</option>
              <option value="VIEWER">Viewer (Observer)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={addMemberMutation.isPending}>
              Add to Project
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => memberToRemove && removeMemberMutation.mutate(memberToRemove)}
        title="Remove Project Member"
        description="Are you sure you want to unassign this team member from the project?"
        confirmLabel="Remove"
        isDestructive
        isLoading={removeMemberMutation.isPending}
      />

      {/* Archive Project Confirmation */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => archiveMutation.mutate()}
        title="Archive Project"
        description="Are you sure you want to archive this project? It will be removed from active listings."
        confirmLabel="Archive Project"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
