'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Dialog } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import { ApiResponse, Milestone, Task, TaskPriority, TaskStatus, User } from '../../types';

interface TaskFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  taskToEdit?: Task | null;
  defaultStatus?: TaskStatus;
  defaultParentTaskId?: string | null;
}

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  taskToEdit,
  defaultStatus = 'TODO',
  defaultParentTaskId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setMilestoneId(taskToEdit.milestoneId || '');
      setParentTaskId(taskToEdit.parentTaskId || '');
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setStartDate(taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '');
      setEstimatedHours(taskToEdit.estimatedHours ? String(taskToEdit.estimatedHours) : '');
      setProgress(taskToEdit.progress || 0);
      setSelectedAssigneeIds(taskToEdit.assignees?.map((a) => a.user.id) || []);
    } else {
      setTitle('');
      setDescription('');
      setMilestoneId('');
      setParentTaskId(defaultParentTaskId || '');
      setStatus(defaultStatus);
      setPriority('MEDIUM');
      setStartDate('');
      setDueDate('');
      setEstimatedHours('');
      setProgress(0);
      setSelectedAssigneeIds([]);
    }
  }, [taskToEdit, defaultStatus, defaultParentTaskId, isOpen]);

  // Fetch project members for assignment
  const { data: projectData } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>(`/projects/${projectId}`);
      return res.data.data;
    },
    enabled: isOpen,
  });

  // Fetch project milestones
  const { data: milestonesData } = useQuery({
    queryKey: ['project-milestones-dropdown', projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Milestone[]>>(`/projects/${projectId}/milestones?limit=100`);
      return res.data.data;
    },
    enabled: isOpen,
  });

  // Fetch existing tasks for parent selector (if creating subtask)
  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks-dropdown', projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks?parentOnly=true&limit=100`);
      return res.data.data;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        milestoneId: milestoneId || undefined,
        parentTaskId: parentTaskId || undefined,
        status,
        priority,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        progress,
        assigneeIds: selectedAssigneeIds,
      };

      if (taskToEdit) {
        return api.patch(`/tasks/${taskToEdit.id}`, payload);
      } else {
        return api.post(`/projects/${projectId}/tasks`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', taskToEdit?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
      showToast('Success', taskToEdit ? 'Task updated.' : 'Task created.', 'success');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save task.';
      showToast('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    },
  });

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? `Edit Task #${taskToEdit.taskNumber}` : 'Create New Task'}
      maxWidth="xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) {
            showToast('Validation Error', 'Task title is required.', 'error');
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
          <Input
            placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <Textarea
            placeholder="Technical details, acceptance criteria, and notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone</label>
            <Select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
              <option value="">No Milestone</option>
              {milestonesData?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Task (For Subtasks)</label>
            <Select value={parentTaskId} onChange={(e) => setParentTaskId(e.target.value)}>
              <option value="">None (Top-Level Task)</option>
              {tasksData
                ?.filter((t) => !taskToEdit || t.id !== taskToEdit.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.taskNumber}: {t.title}
                  </option>
                ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="QA">QA / Testing</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
            <Input
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 16"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Progress: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
            />
          </div>
        </div>

        {/* Multi-Assignee Selection from Project Members */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Assign Team Members
          </label>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50/50">
            {projectData?.members?.map((m: any) => {
              const isSelected = selectedAssigneeIds.includes(m.user.id);
              return (
                <div
                  key={m.user.id}
                  onClick={() => toggleAssignee(m.user.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold'
                      : 'bg-white border border-slate-200/70 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">
                    {m.user.firstName} {m.user.lastName} ({m.user.email})
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isSelected ? 'Assigned' : '+ Add'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={mutation.isPending}>
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
