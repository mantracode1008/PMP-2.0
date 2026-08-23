'use client';

import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/button';
import { X, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface LogTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
  defaultTaskId?: string;
  tasks?: { id: string; taskNumber: number; title: string; projectId: string; projectName?: string }[];
}

export function LogTimeModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
  defaultTaskId,
  tasks = [],
}: LogTimeModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [taskId, setTaskId] = useState(defaultTaskId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('30');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetTaskId = taskId || defaultTaskId;
    const targetProjectId = projectId || defaultProjectId;

    if (!targetTaskId || !targetProjectId) {
      setError('Please select a task to log time against.');
      return;
    }

    const totalMinutes = (parseInt(hours || '0', 10) * 60) + parseInt(minutes || '0', 10);
    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0 minutes.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/projects/${targetProjectId}/tasks/${targetTaskId}/worklogs`, {
        date,
        durationMinutes: totalMinutes,
        description: description.trim() || undefined,
        billable,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to log time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Log Work Time</h3>
              <p className="text-xs text-slate-500">Record time spent on task execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 font-medium border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {tasks.length > 0 && !defaultTaskId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Task *
              </label>
              <select
                value={taskId}
                onChange={(e) => {
                  setTaskId(e.target.value);
                  const sel = tasks.find((t) => t.id === e.target.value);
                  if (sel) setProjectId(sel.projectId);
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Choose a Task --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.taskNumber} - {t.title} {t.projectName ? `(${t.projectName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Hours & Minutes) *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  <span className="ml-1 text-xs text-slate-500 font-medium">h</span>
                </div>
                <div className="flex-1 flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="5"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    placeholder="0"
                  />
                  <span className="ml-1 text-xs text-slate-500 font-medium">m</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What specific tasks, fixes, or deliverables did you accomplish?"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="billable" className="text-xs font-medium text-slate-700 cursor-pointer">
              Mark as billable work
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : 'Save Time Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
