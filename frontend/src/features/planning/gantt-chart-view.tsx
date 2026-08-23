'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ProjectTimelineData, TimelineMilestone, TimelineTask, TimelineSubtask } from '../../types';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Link as LinkIcon,
  Flag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface GanttChartViewProps {
  projectId: string;
  onSelectTask?: (taskId: string) => void;
}

export function GanttChartView({ projectId, onSelectTask }: GanttChartViewProps) {
  const [data, setData] = useState<ProjectTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState<'week' | 'month' | 'quarter'>('month');
  const [collapsedMilestones, setCollapsedMilestones] = useState<{ [id: string]: boolean }>({});
  const [collapsedTasks, setCollapsedTasks] = useState<{ [id: string]: boolean }>({});

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: ProjectTimelineData }>(`/projects/${projectId}/timeline`);
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load project timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [projectId]);

  const toggleMilestone = (id: string) => {
    setCollapsedMilestones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTask = (id: string) => {
    setCollapsedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Determine global date range for Gantt timeline
  const getTimelineBounds = () => {
    let minDate = new Date();
    let maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);

    if (!data || data.tree.length === 0) {
      return { minDate, maxDate, totalDays: 30 };
    }

    let minTime = Number.MAX_SAFE_INTEGER;
    let maxTime = 0;

    data.tree.forEach((m) => {
      if (m.startDate) minTime = Math.min(minTime, new Date(m.startDate).getTime());
      if (m.dueDate) maxTime = Math.max(maxTime, new Date(m.dueDate).getTime());

      m.tasks.forEach((t) => {
        if (t.startDate) minTime = Math.min(minTime, new Date(t.startDate).getTime());
        if (t.dueDate) maxTime = Math.max(maxTime, new Date(t.dueDate).getTime());

        t.subtasks.forEach((s) => {
          if (s.startDate) minTime = Math.min(minTime, new Date(s.startDate).getTime());
          if (s.dueDate) maxTime = Math.max(maxTime, new Date(s.dueDate).getTime());
        });
      });
    });

    if (minTime === Number.MAX_SAFE_INTEGER) minTime = new Date().getTime();
    if (maxTime === 0 || maxTime <= minTime) maxTime = minTime + 30 * 24 * 60 * 60 * 1000;

    // Buffer padding
    const start = new Date(minTime - 3 * 24 * 60 * 60 * 1000);
    const end = new Date(maxTime + 7 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(14, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    return { minDate: start, maxDate: end, totalDays };
  };

  const { minDate, maxDate, totalDays } = getTimelineBounds();

  const getPositionPercent = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const diff = d.getTime() - minDate.getTime();
    const total = maxDate.getTime() - minDate.getTime();
    return Math.max(0, Math.min(100, (diff / total) * 100));
  };

  const getWidthPercent = (startStr?: string | null, dueStr?: string | null) => {
    const left = getPositionPercent(startStr);
    const right = dueStr ? getPositionPercent(dueStr) : left + 5;
    return Math.max(3, right - left);
  };

  const todayPercent = getPositionPercent(new Date().toISOString());

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Controls Bar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Project Gantt & Timeline</h3>
          <span className="text-xs text-slate-400 font-medium">({data?.tree.length || 0} Milestones)</span>
        </div>

        {/* Scale Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setScale('week')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              scale === 'week' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Week Scale
          </button>
          <button
            onClick={() => setScale('month')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              scale === 'month' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Month Scale
          </button>
          <button
            onClick={() => setScale('quarter')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              scale === 'quarter' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Quarter Scale
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading project timeline hierarchy...
        </div>
      ) : !data || data.tree.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No milestones or tasks scheduled for this project.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline Header Bar */}
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2.5 px-4">
              <div className="col-span-5">Milestone / Task Hierarchy</div>
              <div className="col-span-2 text-center">Status / Progress</div>
              <div className="col-span-5 relative">
                <span>Timeline Schedule</span>
                <span className="text-[10px] text-slate-400 font-normal ml-2 lowercase">
                  ({minDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
                  {maxDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                </span>
              </div>
            </div>

            {/* Tree Items */}
            <div className="divide-y divide-slate-100">
              {data.tree.map((milestone) => {
                const isMilestoneCollapsed = collapsedMilestones[milestone.id];
                const mLeft = getPositionPercent(milestone.startDate);
                const mWidth = getWidthPercent(milestone.startDate, milestone.dueDate);

                return (
                  <React.Fragment key={milestone.id}>
                    {/* Milestone Row */}
                    <div className="grid grid-cols-12 items-center py-2.5 px-4 bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
                      <div className="col-span-5 flex items-center gap-2">
                        <button
                          onClick={() => toggleMilestone(milestone.id)}
                          className="p-1 rounded text-slate-500 hover:bg-white transition-colors"
                        >
                          {isMilestoneCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <Flag className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-xs text-slate-900 truncate">{milestone.name}</span>
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                          {milestone.tasks.length} tasks
                        </span>
                      </div>

                      <div className="col-span-2 text-center">
                        <span className="text-xs font-bold text-slate-700">{milestone.progress}%</span>
                      </div>

                      <div className="col-span-5 relative h-6">
                        {/* Milestone Bar */}
                        <div
                          className="absolute h-3.5 top-1 rounded-md bg-indigo-200 border border-indigo-300 shadow-2xs overflow-hidden"
                          style={{ left: `${mLeft}%`, width: `${mWidth}%` }}
                        >
                          <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tasks under Milestone */}
                    {!isMilestoneCollapsed &&
                      milestone.tasks.map((task) => {
                        const isTaskCollapsed = collapsedTasks[task.id];
                        const tLeft = getPositionPercent(task.startDate);
                        const tWidth = getWidthPercent(task.startDate, task.dueDate);

                        return (
                          <React.Fragment key={task.id}>
                            {/* Task Row */}
                            <div className="grid grid-cols-12 items-center py-2 px-4 pl-10 hover:bg-indigo-50/30 transition-colors">
                              <div className="col-span-5 flex items-center gap-2 min-w-0">
                                {task.subtasks.length > 0 ? (
                                  <button
                                    onClick={() => toggleTask(task.id)}
                                    className="p-0.5 rounded text-slate-400 hover:bg-slate-100"
                                  >
                                    {isTaskCollapsed ? (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-4" />
                                )}

                                <button
                                  onClick={() => onSelectTask?.(task.id)}
                                  className="text-left font-semibold text-xs text-slate-800 hover:text-indigo-600 truncate"
                                  title={task.title}
                                >
                                  #{task.taskNumber} - {task.title}
                                </button>

                                {task.dependencies.length > 0 && (
                                  <span
                                    className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded"
                                    title={`Depends on ${task.dependencies.map((d) => `#${d.dependsOnTaskNumber}`).join(', ')}`}
                                  >
                                    <LinkIcon className="h-2.5 w-2.5" />
                                    {task.dependencies.length}
                                  </span>
                                )}
                              </div>

                              <div className="col-span-2 flex items-center justify-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">{task.status}</span>
                                <span className="text-xs font-bold text-indigo-700">{task.progress}%</span>
                              </div>

                              <div className="col-span-5 relative h-6">
                                {/* Task Gantt Bar */}
                                <div
                                  className="absolute h-4 top-1 rounded-md bg-blue-100 border border-blue-300 overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors shadow-2xs"
                                  style={{ left: `${tLeft}%`, width: `${tWidth}%` }}
                                  onClick={() => onSelectTask?.(task.id)}
                                  title={`#${task.taskNumber} ${task.title} (${task.durationDays}d, ${task.progress}%)`}
                                >
                                  <div
                                    className="h-full bg-blue-600 transition-all duration-300"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Subtasks under Task */}
                            {!isTaskCollapsed &&
                              task.subtasks.map((sub) => {
                                const sLeft = getPositionPercent(sub.startDate);
                                const sWidth = getWidthPercent(sub.startDate, sub.dueDate);

                                return (
                                  <div
                                    key={sub.id}
                                    className="grid grid-cols-12 items-center py-1.5 px-4 pl-16 hover:bg-slate-50 transition-colors text-[11px]"
                                  >
                                    <div className="col-span-5 flex items-center gap-2 truncate">
                                      <span className="text-slate-400 font-mono">└</span>
                                      <span className="font-medium text-slate-700 truncate">
                                        #{sub.taskNumber} {sub.title}
                                      </span>
                                    </div>

                                    <div className="col-span-2 text-center text-[10px] text-slate-500 font-medium">
                                      {sub.status} ({sub.progress}%)
                                    </div>

                                    <div className="col-span-5 relative h-5">
                                      <div
                                        className="absolute h-2.5 top-1 rounded-sm bg-slate-200 overflow-hidden"
                                        style={{ left: `${sLeft}%`, width: `${sWidth}%` }}
                                      >
                                        <div
                                          className="h-full bg-slate-600"
                                          style={{ width: `${sub.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
