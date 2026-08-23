'use client';

import React from 'react';
import { ProjectBaseline } from '@/types';
import {
  Compass,
  Plus,
  GitCompare,
  Calendar,
  Layers,
  Clock,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';

interface BaselineListProps {
  baselines: ProjectBaseline[];
  onCaptureBaseline: () => void;
  onCompareBaseline: (baseline: ProjectBaseline) => void;
}

export const BaselineList: React.FC<BaselineListProps> = ({
  baselines,
  onCaptureBaseline,
  onCompareBaseline,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            Project Baselines & Snapshot Register
          </h3>
          <p className="text-xs text-slate-500">
            Immutable reference points for schedule, effort, and scope variance analysis
          </p>
        </div>

        <button
          type="button"
          onClick={onCaptureBaseline}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Capture Baseline Snapshot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {baselines.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            No baselines have been captured for this project yet.
          </div>
        ) : (
          baselines.map((base) => (
            <div
              key={base.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-600">
                    BASELINE #{base.baselineNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(base.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{base.name}</h4>
                {base.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{base.description}</p>
                )}
              </div>

              {base.snapshot && (
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Tasks</div>
                    <div className="text-sm font-bold text-slate-800">{base.snapshot.totalTasks}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Milestones</div>
                    <div className="text-sm font-bold text-slate-800">{base.snapshot.totalMilestones}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Est. Hours</div>
                    <div className="text-sm font-bold text-slate-800">{base.snapshot.totalEstimatedHours}h</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => onCompareBaseline(base)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5 text-emerald-600" />
                Compare vs Live Metrics
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
