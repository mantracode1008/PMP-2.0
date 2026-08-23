'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ProjectProgressData, ProjectTimeSummary } from '../../types';
import { Button } from '../../components/ui/button';
import { LogTimeModal } from '../timesheets/log-time-modal';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Plus,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface ProjectTimeSummaryWidgetProps {
  projectId: string;
}

export function ProjectTimeSummaryWidget({ projectId }: ProjectTimeSummaryWidgetProps) {
  const [progressData, setProgressData] = useState<ProjectProgressData | null>(null);
  const [timeSummary, setTimeSummary] = useState<ProjectTimeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.get<{ data: ProjectProgressData }>(`/projects/${projectId}/progress`),
        api.get<{ data: ProjectTimeSummary }>(`/projects/${projectId}/time-summary`),
      ]);
      setProgressData(pRes.data.data);
      setTimeSummary(tRes.data.data);
    } catch (err: any) {
      console.error('Failed to load project time & progress metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
        Calculating project effort, progress, and logged time...
      </div>
    );
  }

  const overallProgress = progressData?.overallProgress || 0;
  const totalEstimatedHours = timeSummary?.totalEstimatedHours || 0;
  const totalActualHours = timeSummary?.totalActualHours || 0;
  const remainingHours = timeSummary?.remainingEstimatedHours || 0;
  const overEstimateTasks = timeSummary?.overEstimateTasks || [];

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Effort-Weighted Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overall Progress</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{overallProgress}%</div>
          <div className="mt-2.5 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {progressData?.metrics.completedTasks || 0} of {progressData?.metrics.totalTasks || 0} top-level tasks completed
          </span>
        </div>

        {/* Estimated Effort */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Effort</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{totalEstimatedHours}h</div>
          <span className="text-[11px] text-slate-500 mt-2 block">Total scoped backlog estimate</span>
        </div>

        {/* Actual Logged Time */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Actual Logged</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 font-mono">{totalActualHours}h</div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {timeSummary?.totalActualMinutes || 0} minutes recorded
          </span>
        </div>

        {/* Remaining / Over Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Remaining Budget</span>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{remainingHours}h</div>
          <span className="text-[11px] text-slate-500 mt-2 block">
            {overEstimateTasks.length > 0 ? (
              <span className="text-rose-600 font-semibold">{overEstimateTasks.length} task(s) over estimate</span>
            ) : (
              'On track with scope budget'
            )}
          </span>
        </div>
      </div>

      {/* Over-Estimate Warning Alert */}
      {overEstimateTasks.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-900">
                Tasks Exceeding Estimated Hours ({overEstimateTasks.length})
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                The following tasks have accumulated more logged work hours than originally estimated:
              </p>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {overEstimateTasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[240px]">
                      <span className="font-bold text-slate-900">#{t.taskNumber}</span>
                      <span className="text-slate-700 ml-1 truncate">{t.title}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {t.loggedHours}h / {t.estimatedHours}h
                      </span>
                      <span className="text-xs font-bold text-rose-600 font-mono">+{t.overHours}h over</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Progress Breakdown */}
      {progressData?.milestones && progressData.milestones.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Milestone Progress Breakdown</h4>
            <span className="text-xs text-slate-500 font-medium">
              {progressData.milestones.length} active milestones
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {progressData.milestones.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 truncate">{m.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-2 w-full max-w-md h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-slate-900">{m.progress}%</span>
                  <span className="text-xs text-slate-400 block">
                    {m.completedTasks} / {m.totalTasks} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <LogTimeModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={fetchData}
        defaultProjectId={projectId}
      />
    </div>
  );
}
