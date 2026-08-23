'use client';

import React from 'react';
import { ProjectTemplate } from '@/types';
import {
  FolderKanban,
  Sparkles,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface ProjectTemplatesListProps {
  templates: ProjectTemplate[];
  onInstantiate: (template: ProjectTemplate) => void;
  onCreateTemplate?: () => void;
}

export const ProjectTemplatesList: React.FC<ProjectTemplatesListProps> = ({
  templates,
  onInstantiate,
  onCreateTemplate,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            Project Templates Library
          </h2>
          <p className="text-sm text-slate-500">
            Kickstart standardized delivery workflows with pre-configured milestones and task structures
          </p>
        </div>

        {onCreateTemplate && (
          <button
            type="button"
            onClick={onCreateTemplate}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tmpl.category || 'Standard Project'}
                </span>
                {tmpl.isSystem && (
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    System Preset
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {tmpl.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {tmpl.description || 'Complete standardized delivery roadmap with predefined milestone checkpoints.'}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tmpl.estimatedDurationDays} Days</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tmpl.milestones?.length || 0} Milestones</span>
                </div>
              </div>

              {tmpl.defaultRoles && tmpl.defaultRoles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tmpl.defaultRoles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 border border-slate-200"
                    >
                      {role.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => onInstantiate(tmpl)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Instantiate Project
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
