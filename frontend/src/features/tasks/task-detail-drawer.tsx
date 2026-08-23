'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../auth/auth-context';
import { TaskStatusBadge } from './task-status-badge';
import { TaskPriorityBadge } from './task-priority-badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Dialog } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/toast';
import { formatDate, getInitials, formatBytes } from '../../lib/utils';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Paperclip,
  MessageSquare,
  GitCommit,
  CheckCircle2,
  Send,
  Download,
  AlertCircle,
  FileText,
  Edit2,
  Check,
} from 'lucide-react';
import { ApiResponse, DependencyType, Task, TaskPriority, TaskStatus, TaskTimeSummary, WorkLog } from '../../types';
import { LogTimeModal } from '../timesheets/log-time-modal';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  onEditTask?: (task: Task) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  onClose,
  onEditTask,
}) => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'subtasks' | 'attachments' | 'dependencies' | 'time'>('details');
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddDepOpen, setIsAddDepOpen] = useState(false);
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false);
  const [selectedDepTaskId, setSelectedDepTaskId] = useState('');
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('DEPENDS_ON');
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

  // Time tracking summary query
  const { data: timeSummary, refetch: refetchTime } = useQuery({
    queryKey: ['task-time-summary', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await api.get<{ data: TaskTimeSummary }>(`/tasks/${taskId}/time-summary`);
      return res.data.data;
    },
    enabled: !!taskId,
  });

  // Task work logs query
  const { data: taskWorkLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['task-work-logs', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await api.get<{ data: WorkLog[] }>(`/worklogs?taskId=${taskId}`);
      return res.data.data;
    },
    enabled: !!taskId && activeTab === 'time',
  });

  // Fetch sibling tasks for dependencies
  const { data: siblingTasks } = useQuery({
    queryKey: ['project-sibling-tasks', task?.projectId],
    queryFn: async () => {
      if (!task?.projectId) return [];
      const res = await api.get<ApiResponse<Task[]>>(`/projects/${task.projectId}/tasks?limit=100`);
      return res.data.data.filter((t) => t.id !== taskId);
    },
    enabled: isAddDepOpen && !!task?.projectId,
  });

  // Quick Status Transition Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: TaskStatus) => {
      if (!taskId) return;
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
      showToast('Success', 'Status updated.', 'success');
    },
  });

  // Quick Priority Update Mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async (newPriority: TaskPriority) => {
      if (!taskId) return;
      await api.patch(`/tasks/${taskId}`, { priority: newPriority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Success', 'Priority updated.', 'success');
    },
  });

  // Quick Progress Update Mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      if (!taskId) return;
      await api.patch(`/tasks/${taskId}`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Add Subtask Mutation
  const addSubtaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !newSubtaskTitle.trim() || !task) return;
      await api.post(`/projects/${task.projectId}/tasks`, {
        title: newSubtaskTitle.trim(),
        parentTaskId: taskId,
        status: 'TODO',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtaskTitle('');
      showToast('Success', 'Subtask added.', 'success');
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !newComment.trim()) return;
      await api.post(`/tasks/${taskId}/comments`, {
        content: newComment.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setNewComment('');
      showToast('Success', 'Comment posted.', 'success');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to post comment.', 'error');
    },
  });

  // Add Dependency Mutation
  const addDependencyMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !selectedDepTaskId) return;
      await api.post(`/tasks/${taskId}/dependencies`, {
        dependsOnTaskId: selectedDepTaskId,
        dependencyType: selectedDepType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setIsAddDepOpen(false);
      setSelectedDepTaskId('');
      showToast('Success', 'Dependency link created.', 'success');
    },
    onError: (err: any) => {
      showToast('Dependency Error', err.response?.data?.message || 'Failed to create dependency.', 'error');
    },
  });

  // Remove Dependency Mutation
  const removeDependencyMutation = useMutation({
    mutationFn: async (dependsOnTaskId: string) => {
      if (!taskId) return;
      await api.delete(`/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      showToast('Success', 'Dependency removed.', 'success');
    },
  });

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      showToast('Success', 'Attachment uploaded.', 'success');
    } catch (err: any) {
      showToast('Upload Error', err.response?.data?.message || 'Failed to upload file.', 'error');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // Download Handler
  const handleDownloadAttachment = (docId: string, filename: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/documents/${docId}/download`, '_blank');
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              #{task?.taskNumber || '...'}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
              {task?.project?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {task && onEditTask && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onEditTask(task)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Task
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Quick Controls */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
              {task.parentTask && (
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  Subtask of #{task.parentTask.taskNumber}: {task.parentTask.title}
                </p>
              )}
            </div>

            {/* Quick Status, Priority, Progress Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value as TaskStatus)}
                  className="w-full text-xs font-semibold rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="QA">QA / Testing</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => updatePriorityMutation.mutate(e.target.value as TaskPriority)}
                  className="w-full text-xs font-semibold rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">Due Date</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {formatDate(task.dueDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                  Progress ({task.progress}%)
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={task.progress}
                  onChange={(e) => updateProgressMutation.mutate(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                />
              </div>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="flex border-b border-slate-200 text-xs font-semibold gap-4">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === 'details'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('subtasks')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                  activeTab === 'subtasks'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Subtasks ({task.subtasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('dependencies')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                  activeTab === 'dependencies'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Dependencies ({task.dependencies?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('time')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                  activeTab === 'time'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Time ({timeSummary?.loggedHours || 0}h)
              </button>
              <button
                onClick={() => setActiveTab('attachments')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                  activeTab === 'attachments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Attachments ({task.attachments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1 ${
                  activeTab === 'comments'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Discussion ({task.comments?.length || 0})
              </button>
            </div>

            {/* TAB: Details */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Description
                  </h4>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed p-3.5 rounded-xl border border-slate-100 bg-slate-50/40">
                    {task.description || 'No detailed description provided.'}
                  </div>
                </div>

                {/* Milestone & Assignees */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">Milestone</h4>
                    {task.milestone ? (
                      <span className="font-semibold text-slate-800 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-lg inline-block">
                        {task.milestone.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-slate-500 mb-2">Assignees</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {task.assignees && task.assignees.length > 0 ? (
                        task.assignees.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-semibold"
                          >
                            <span className="h-4 w-4 rounded-full bg-indigo-600 text-[9px] text-white flex items-center justify-center font-bold">
                              {getInitials(a.user.firstName, a.user.lastName)}
                            </span>
                            <span>{a.user.firstName} {a.user.lastName}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Subtasks */}
            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addSubtaskMutation.mutate();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Add direct subtask item..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="text-xs"
                  />
                  <Button type="submit" size="sm" isLoading={addSubtaskMutation.isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </form>

                <div className="space-y-2">
                  {task.subtasks && task.subtasks.length > 0 ? (
                    task.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() =>
                              api
                                .put(`/tasks/${sub.id}/status`, {
                                  status: sub.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                                })
                                .then(() => queryClient.invalidateQueries({ queryKey: ['task', taskId] }))
                            }
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              sub.status === 'COMPLETED'
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-indigo-600'
                            }`}
                          >
                            {sub.status === 'COMPLETED' && <Check className="h-3 w-3" />}
                          </button>
                          <span
                            className={`text-xs font-semibold truncate ${
                              sub.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            #{sub.taskNumber}: {sub.title}
                          </span>
                        </div>
                        <TaskStatusBadge status={sub.status} showIcon={false} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No subtasks created for this task.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Dependencies */}
            {activeTab === 'dependencies' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Blockers and linked execution tasks</p>
                  <Button size="sm" variant="outline" onClick={() => setIsAddDepOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Link Task
                  </Button>
                </div>

                <div className="space-y-2">
                  {task.dependencies && task.dependencies.length > 0 ? (
                    task.dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                            {dep.dependencyType}
                          </span>
                          <span className="font-semibold text-slate-900">
                            #{dep.dependsOnTask?.taskNumber}: {dep.dependsOnTask?.title}
                          </span>
                        </div>
                        <button
                          onClick={() => removeDependencyMutation.mutate(dep.dependsOnTaskId)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No dependencies mapped.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Attachments */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Task attachments and specifications</p>
                  <label className="cursor-pointer">
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
                      <Paperclip className="h-3.5 w-3.5 text-indigo-600" />
                      {uploadingFile ? 'Uploading...' : 'Upload File'}
                    </span>
                  </label>
                </div>

                <div className="space-y-2">
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 truncate">{att.originalFileName}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatBytes(att.fileSize)} • Uploaded by {att.uploadedBy?.firstName}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadAttachment(att.id, att.originalFileName)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No attachments uploaded.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Comments & Discussion */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCommentMutation.mutate();
                  }}
                  className="space-y-2"
                >
                  <Textarea
                    placeholder="Write a comment... (use @Name to mention team members)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={addCommentMutation.isPending}
                      disabled={!newComment.trim()}
                    >
                      <Send className="h-3 w-3 mr-1.5" /> Post Comment
                    </Button>
                  </div>
                </form>

                <div className="space-y-3 pt-2">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                              {getInitials(c.user.firstName, c.user.lastName)}
                            </span>
                            <span className="font-bold text-slate-900">
                              {c.user.firstName} {c.user.lastName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap pl-7">
                          {c.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">No comments yet. Start the conversation!</p>
                  )}
                </div>
              </div>
            )}
            {/* TAB: Time Tracking */}
            {activeTab === 'time' && (
              <div className="space-y-5">
                {/* Time Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                      {timeSummary?.estimatedHours || 0}h
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logged</span>
                    <p className="text-sm font-black text-indigo-700 mt-0.5 font-mono">
                      {timeSummary?.loggedHours || 0}h
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remaining</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">
                      {timeSummary?.remainingHours || 0}h
                    </p>
                  </div>
                </div>

                {/* Over estimate indicator */}
                {timeSummary?.isOverEstimate && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      Task is over estimate
                    </span>
                    <span className="font-mono text-rose-700">+{timeSummary.overEstimateHours}h over budget</span>
                  </div>
                )}

                {/* Actions & Work Logs Header */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Logged Work Time ({taskWorkLogs?.length || 0})
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setIsLogTimeOpen(true)}
                    className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5"
                  >
                    <Plus className="h-3 w-3" /> Log Time
                  </Button>
                </div>

                {/* Work Logs List */}
                <div className="space-y-2">
                  {taskWorkLogs && taskWorkLogs.length > 0 ? (
                    taskWorkLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors text-xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'User'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(log.date)}
                            </span>
                            {log.billable && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Billable
                              </span>
                            )}
                          </div>
                          {log.description && (
                            <p className="text-slate-600 mt-1 truncate">{log.description}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-indigo-700 text-xs">
                            {Number((log.durationMinutes / 60).toFixed(1))}h
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ({log.durationMinutes}m)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No time entries logged against this task yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <LogTimeModal
          isOpen={isLogTimeOpen}
          onClose={() => setIsLogTimeOpen(false)}
          onSuccess={() => {
            refetchTime();
            refetchLogs();
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
          }}
          defaultProjectId={task?.projectId}
          defaultTaskId={task?.id}
        />

        {/* Add Dependency Modal */}
        <Dialog
          isOpen={isAddDepOpen}
          onClose={() => setIsAddDepOpen(false)}
          title="Link Task Dependency"
          maxWidth="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addDependencyMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Task *</label>
              <Select
                value={selectedDepTaskId}
                onChange={(e) => setSelectedDepTaskId(e.target.value)}
                required
              >
                <option value="">Choose task...</option>
                {siblingTasks?.map((st) => (
                  <option key={st.id} value={st.id}>
                    #{st.taskNumber}: {st.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dependency Relationship</label>
              <Select
                value={selectedDepType}
                onChange={(e) => setSelectedDepType(e.target.value as DependencyType)}
              >
                <option value="DEPENDS_ON">Depends On (Current task cannot start until target is done)</option>
                <option value="BLOCKS">Blocks (Target task cannot start until this is done)</option>
                <option value="RELATED_TO">Related To</option>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDepOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={addDependencyMutation.isPending}>
                Save Dependency
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </div>
  );
};
