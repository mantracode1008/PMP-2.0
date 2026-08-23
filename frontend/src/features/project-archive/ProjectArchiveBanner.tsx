'use client';

import React from 'react';
import { Project, ProjectStatus } from '@/types';
import { Archive, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ProjectArchiveBannerProps {
  project: Project;
  onRestore: () => Promise<void>;
  canRestore?: boolean;
}

export const ProjectArchiveBanner: React.FC<ProjectArchiveBannerProps> = ({
  project,
  onRestore,
  canRestore = false,
}) => {
  if (project.status !== 'ARCHIVED') return null;

  return (
    <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 mb-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>Project is Archived & Locked (Read-Only Mode)</span>
            </h4>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Task creation, edits, timesheet logs, and recurring task triggers are disabled for this project.
            </p>
          </div>
        </div>

        {canRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restore Project to Active
          </button>
        )}
      </div>
    </div>
  );
};
