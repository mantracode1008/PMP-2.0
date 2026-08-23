'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { DataTable, Column } from '../../components/shared/data-table';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { formatDate, getInitials } from '../../lib/utils';
import {
  Calendar,
  Plus,
  CheckSquare,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { ApiResponse, Milestone, Task, TaskPriority, TaskStatus } from '../../types';

interface TaskListViewProps {
  tasks: Task[];
  meta?: any;
  isLoading: boolean;
  projectId: string;
  milestones?: Milestone[];
  search: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  milestoneFilter: string;
  onMilestoneFilterChange: (milestoneId: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  meta,
  isLoading,
  projectId,
  milestones,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  milestoneFilter,
  onMilestoneFilterChange,
  page,
  onPageChange,
  onTaskClick,
  onAddTask,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
      showToast('Success', 'Status updated.', 'success');
    },
  });

  const columns: Column<Task>[] = [
    {
      header: 'Task # & Title',
      cell: (t) => (
        <div className="space-y-0.5 max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              #{t.taskNumber}
            </span>
            <button
              onClick={() => onTaskClick(t)}
              className="text-left font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1"
            >
              {t.title}
            </button>
          </div>
          {t.parentTask && (
            <p className="text-[10px] text-slate-400 pl-8">Subtask of #{t.parentTask.taskNumber}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (t) => (
        <select
          value={t.status}
          onChange={(e) => {
            e.stopPropagation();
            statusMutation.mutate({ taskId: t.id, newStatus: e.target.value as TaskStatus });
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
      ),
    },
    {
      header: 'Priority',
      cell: (t) => <TaskPriorityBadge priority={t.priority} />,
    },
    {
      header: 'Assignees',
      cell: (t) => (
        <div className="flex -space-x-1.5 overflow-hidden">
          {t.assignees && t.assignees.length > 0 ? (
            t.assignees.slice(0, 3).map((a) => (
              <span
                key={a.id}
                title={`${a.user.firstName} ${a.user.lastName}`}
                className="inline-flex h-6 w-6 rounded-full ring-1 ring-white bg-indigo-600 text-white text-[10px] font-bold items-center justify-center"
              >
                {getInitials(a.user.firstName, a.user.lastName)}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Milestone',
      cell: (t) => (
        <span className="text-xs font-medium text-slate-600 truncate max-w-xs block">
          {t.milestone?.name || '—'}
        </span>
      ),
    },
    {
      header: 'Progress',
      cell: (t) => (
        <div className="w-24 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>{t.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${t.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      cell: (t) => (
        <span className="text-xs text-slate-500 flex items-center gap-1">
          {t.dueDate ? (
            <>
              <Calendar className="h-3 w-3 text-slate-400" />
              {formatDate(t.dueDate)}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      header: 'Action',
      cell: (t) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onTaskClick(t)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={tasks}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Search tasks by title or description..."
        searchValue={search}
        onSearchChange={onSearchChange}
        onPageChange={onPageChange}
        emptyTitle="No tasks found"
        emptyDescription="Create your first task or adjust active search filters."
        emptyActionLabel="Create Task"
        onEmptyAction={onAddTask}
        filterComponent={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-9 text-xs w-32"
            >
              <option value="">All Statuses</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="QA">QA</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </Select>

            <Select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="h-9 text-xs w-32"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>

            {milestones && milestones.length > 0 && (
              <Select
                value={milestoneFilter}
                onChange={(e) => onMilestoneFilterChange(e.target.value)}
                className="h-9 text-xs w-36"
              >
                <option value="">All Milestones</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        }
      />
    </div>
  );
};
