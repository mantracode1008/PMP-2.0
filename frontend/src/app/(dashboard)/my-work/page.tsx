'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { TaskStatusBadge } from '../../../features/tasks/task-status-badge';
import { TaskPriorityBadge } from '../../../features/tasks/task-priority-badge';
import { TaskDetailDrawer } from '../../../features/tasks/task-detail-drawer';
import { formatDate, getInitials } from '../../../lib/utils';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  PlayCircle,
  Eye,
  CheckCircle2,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ApiResponse, MyWorkData, Task, TaskStatus } from '../../../types';

type MyWorkTab = 'all' | 'overdue' | 'today' | 'upcoming' | 'inProgress' | 'waitingReview' | 'completed';

export default function MyWorkPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<MyWorkTab>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-work'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MyWorkData>>('/my-work');
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  const getFilteredTasks = (): Task[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'overdue':
        return data.groups.overdue;
      case 'today':
        return data.groups.today;
      case 'upcoming':
        return data.groups.upcoming;
      case 'inProgress':
        return data.groups.inProgress;
      case 'waitingReview':
        return data.groups.waitingReview;
      case 'completed':
        return data.groups.completed;
      default:
        return data.allTasks;
    }
  };

  const tasks = getFilteredTasks();
  const metrics = data?.metrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="My Work & Focus"
        description="Unified work execution stream aggregating tasks assigned to you across all projects."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My Work' }]}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          onClick={() => setActiveTab('overdue')}
          className={`cursor-pointer transition-all hover:border-rose-300 ${
            activeTab === 'overdue' ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-rose-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Overdue</span>
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.overdueCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('today')}
          className={`cursor-pointer transition-all hover:border-blue-300 ${
            activeTab === 'today' ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Due Today</span>
              <Clock className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.todayCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('inProgress')}
          className={`cursor-pointer transition-all hover:border-amber-300 ${
            activeTab === 'inProgress' ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
              <PlayCircle className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.inProgressCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('waitingReview')}
          className={`cursor-pointer transition-all hover:border-purple-300 ${
            activeTab === 'waitingReview' ? 'border-purple-400 bg-purple-50/40 ring-1 ring-purple-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-purple-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">In Review</span>
              <Eye className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.waitingReviewCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('completed')}
          className={`cursor-pointer transition-all hover:border-emerald-300 ${
            activeTab === 'completed' ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.completedCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer transition-all hover:border-slate-400 ${
            activeTab === 'all' ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-200' : ''
          }`}
        >
          <CardContent className="p-3.5 space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Assigned</span>
              <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{metrics?.totalAssigned ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All Tasks', count: data?.allTasks.length ?? 0 },
          { id: 'overdue', label: 'Overdue', count: metrics?.overdueCount ?? 0 },
          { id: 'today', label: 'Due Today', count: metrics?.todayCount ?? 0 },
          { id: 'upcoming', label: 'Upcoming', count: data?.groups.upcoming.length ?? 0 },
          { id: 'inProgress', label: 'In Progress', count: metrics?.inProgressCount ?? 0 },
          { id: 'waitingReview', label: 'In Review / QA', count: metrics?.waitingReviewCount ?? 0 },
          { id: 'completed', label: 'Completed', count: metrics?.completedCount ?? 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as MyWorkTab)}
            className={`px-3 py-2 transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
          <CheckSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No tasks in this category</h4>
          <p className="text-xs text-slate-400 mt-1">You are all caught up on your assigned work items.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTaskId(t.id)}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    #{t.taskNumber}
                  </span>
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{t.title}</h4>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <Link
                    href={`/projects/${t.projectId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-indigo-600 hover:underline font-medium"
                  >
                    <Briefcase className="h-3 w-3" />
                    {t.project?.name}
                  </Link>

                  {t.milestone && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Layers className="h-3 w-3 text-slate-400" />
                      {t.milestone.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Due Date */}
              <div
                className="flex items-center gap-3 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <TaskPriorityBadge priority={t.priority} />

                <select
                  value={t.status}
                  onChange={(e) =>
                    statusMutation.mutate({ taskId: t.id, newStatus: e.target.value as TaskStatus })
                  }
                  className="text-xs font-semibold rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="QA">QA</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <div className="text-right min-w-24">
                  <span className="text-[11px] text-slate-400 block">Due Date</span>
                  <span
                    className={`text-xs font-semibold ${
                      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
                        ? 'text-rose-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {formatDate(t.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
