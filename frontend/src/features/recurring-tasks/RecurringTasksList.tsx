'use client';

import React from 'react';
import { RecurringTaskDefinition, RecurrenceFrequency } from '@/types';
import {
  Repeat,
  Plus,
  Play,
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
} from 'lucide-react';

interface RecurringTasksListProps {
  definitions: RecurringTaskDefinition[];
  onCreateRecurring: () => void;
  onGenerateTasks?: () => Promise<void>;
  onToggleActive?: (defId: string, isActive: boolean) => Promise<void>;
}

export const RecurringTasksList: React.FC<RecurringTasksListProps> = ({
  definitions,
  onCreateRecurring,
  onGenerateTasks,
  onToggleActive,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Recurring Task Schedules</h3>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateTasks && (
            <button
              type="button"
              onClick={onGenerateTasks}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-indigo-600" />
              Generate Due Tasks Now
            </button>
          )}

          <button
            type="button"
            onClick={onCreateRecurring}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recurring Schedule
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Scheduled Run</th>
                <th className="py-3 px-4">Last Generated</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {definitions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Repeat className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No recurring task schedules configured.
                  </td>
                </tr>
              ) : (
                definitions.map((def) => (
                  <tr key={def.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{def.title}</div>
                      {def.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {def.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 text-[10px]">
                        {def.frequency} (Every {def.interval})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {new Date(def.nextRunDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {def.lastGeneratedDate ? (
                        new Date(def.lastGeneratedDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-400 italic">Never</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          def.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {def.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {onToggleActive && (
                        <button
                          type="button"
                          onClick={() => onToggleActive(def.id, !def.isActive)}
                          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {def.isActive ? 'Pause' : 'Resume'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

