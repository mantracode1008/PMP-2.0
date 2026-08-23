'use client';

import React from 'react';
import { TaskTemplate } from '@/types';
import { CheckSquare, Clock, Plus, Tag } from 'lucide-react';

interface TaskTemplatesListProps {
  taskTemplates: TaskTemplate[];
  onCreateTaskTemplate?: () => void;
}

export const TaskTemplatesList: React.FC<TaskTemplatesListProps> = ({
  taskTemplates,
  onCreateTaskTemplate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Standalone Task Templates</h3>
          <p className="text-xs text-slate-500">Standardized task checklists for repetitive work</p>
        </div>
        {onCreateTaskTemplate && (
          <button
            type="button"
            onClick={onCreateTaskTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskTemplates.map((task) => (
          <div
            key={task.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                {task.defaultRole || 'GENERIC'}
              </span>
              {task.estimatedHours && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {task.estimatedHours}h est.
                </span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
              {task.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </div>

            {task.checklist && task.checklist.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Checklist ({task.checklist.length})
                </div>
                {task.checklist.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <CheckSquare className="w-3 h-3 text-indigo-600" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
