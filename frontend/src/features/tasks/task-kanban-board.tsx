'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { formatDate, getInitials } from '../../lib/utils';
import {
  Plus,
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';

interface TaskKanbanBoardProps {
  tasks: Task[];
  projectId: string;
  onTaskClick: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; dotColor: string }[] = [
  { id: 'BACKLOG', title: 'Backlog', color: 'border-slate-300', dotColor: 'bg-slate-400' },
  { id: 'TODO', title: 'To Do', color: 'border-blue-300', dotColor: 'bg-blue-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-amber-300', dotColor: 'bg-amber-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-purple-300', dotColor: 'bg-purple-500' },
  { id: 'QA', title: 'QA / Testing', color: 'border-indigo-300', dotColor: 'bg-indigo-500' },
  { id: 'BLOCKED', title: 'Blocked', color: 'border-rose-300', dotColor: 'bg-rose-500' },
  { id: 'COMPLETED', title: 'Completed', color: 'border-emerald-300', dotColor: 'bg-emerald-500' },
  { id: 'CANCELLED', title: 'Cancelled', color: 'border-slate-300', dotColor: 'bg-slate-400' },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  projectId,
  onTaskClick,
  onAddTask,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Status transition mutation with optimistic update
  const statusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
      const previousTasks = queryClient.getQueryData(['tasks', projectId]);

      queryClient.setQueryData(['tasks', projectId], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((t: Task) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      });

      return { previousTasks };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      showToast('Status Update Failed', err.response?.data?.message || 'Could not move task.', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverColumn(null);
    setDraggedTaskId(null);

    if (taskId) {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== columnId) {
        statusMutation.mutate({ taskId, newStatus: columnId });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 pt-1 select-none">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-2xl border bg-slate-50/75 p-3.5 transition-all min-h-[260px] ${
              isOver
                ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200 shadow-md'
                : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200/60 mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {col.title}
                </h3>
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600">
                  {columnTasks.length}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md cursor-pointer"
                onClick={() => onAddTask(col.id)}
                title={`Add task in ${col.title}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Task Cards Column */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[340px] pr-0.5">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  className={`p-3 rounded-xl border bg-white shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all cursor-pointer space-y-2 ${
                    draggedTaskId === task.id ? 'opacity-40 ring-2 ring-indigo-400' : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{task.taskNumber}
                    </span>
                    <TaskPriorityBadge priority={task.priority} />
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {task.title}
                  </h4>

                  {task.milestone && (
                    <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded truncate max-w-full">
                      {task.milestone.name}
                    </span>
                  )}

                  {/* Footer Stats & Assignees */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      {(task.subtaskCount ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <CheckSquare className="h-3 w-3 text-slate-400" />
                          {task.subtaskCount}
                        </span>
                      )}
                      {(task.commentCount ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3 text-slate-400" />
                          {task.commentCount}
                        </span>
                      )}
                    </div>

                    {/* Assignee Avatar Pile */}
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.slice(0, 3).map((a) => (
                          <span
                            key={a.id}
                            title={`${a.user.firstName} ${a.user.lastName}`}
                            className="inline-flex h-5 w-5 rounded-full ring-1 ring-white bg-indigo-600 text-white text-[9px] font-bold items-center justify-center"
                          >
                            {getInitials(a.user.firstName, a.user.lastName)}
                          </span>
                        ))
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-dashed border-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div
                  onClick={() => onAddTask(col.id)}
                  className="py-6 border-2 border-dashed border-slate-200/80 rounded-xl text-center cursor-pointer hover:border-slate-300 hover:bg-white/60 text-slate-400 text-xs hover:text-slate-600 transition-all"
                >
                  + Add task
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

