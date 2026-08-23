'use client';

import React from 'react';
import { ProjectHealthReport, ProjectHealth } from '@/types';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Calendar,
  Layers,
  Users,
  ShieldAlert,
  Bug,
} from 'lucide-react';

interface ProjectHealthWidgetProps {
  healthReport: ProjectHealthReport;
  onOpenOverride?: () => void;
  onResetOverride?: () => void;
  canOverride?: boolean;
}

export const ProjectHealthWidget: React.FC<ProjectHealthWidgetProps> = ({
  healthReport,
  onOpenOverride,
  onResetOverride,
  canOverride = false,
}) => {
  const getHealthBadge = (health: ProjectHealth) => {
    switch (health) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertOctagon,
          text: 'Critical Attention',
        };
      case 'AT_RISK':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertTriangle,
          text: 'At Risk',
        };
      case 'HEALTHY':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          text: 'Healthy & On Track',
        };
    }
  };

  const currentBadge = getHealthBadge(healthReport.overallHealth);
  const BadgeIcon = currentBadge.icon;

  const DIMENSIONS = [
    { key: 'schedule', label: 'Schedule', icon: Calendar, data: healthReport.dimensions.schedule },
    { key: 'scope', label: 'Scope', icon: Layers, data: healthReport.dimensions.scope },
    { key: 'resources', label: 'Resources', icon: Users, data: healthReport.dimensions.resources },
    { key: 'risks', label: 'Risk Exposure', icon: ShieldAlert, data: healthReport.dimensions.risks },
    { key: 'issues', label: 'Active Issues', icon: Bug, data: healthReport.dimensions.issues },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Project Health Intelligence</h3>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentBadge.bg}`}
              >
                <BadgeIcon className="w-3.5 h-3.5" />
                {currentBadge.text}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated across 5 quantitative project dimensions
            </p>
          </div>
        </div>

        {/* Override Controls */}
        {canOverride && (
          <div className="flex items-center gap-2">
            {healthReport.isOverridden && (
              <button
                type="button"
                onClick={onResetOverride}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Override
              </button>
            )}
            <button
              type="button"
              onClick={onOpenOverride}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Override Health
            </button>
          </div>
        )}
      </div>

      {/* Override Banner if active */}
      {healthReport.isOverridden && healthReport.overrideDetails && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Manual Governance Override Active: </span>
            {healthReport.overrideDetails.reason || 'No reason specified'}
            <div className="text-[11px] text-amber-700 mt-1">
              Calculated Health: <span className="font-mono font-semibold">{healthReport.calculatedHealth}</span> • Overridden by{' '}
              {healthReport.overrideDetails.overriddenBy?.firstName}{' '}
              {healthReport.overrideDetails.overriddenBy?.lastName}
            </div>
          </div>
        </div>
      )}

      {/* 5-Dimensional Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {DIMENSIONS.map((dim) => {
          const DimIcon = dim.icon;
          const statusBadge = getHealthBadge(dim.data.status);
          return (
            <div
              key={dim.key}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DimIcon className="w-4 h-4 text-slate-400" />
                  {dim.label}
                </div>
                <span className={`w-2 h-2 rounded-full ${
                  dim.data.status === 'CRITICAL'
                    ? 'bg-rose-500 animate-ping'
                    : dim.data.status === 'AT_RISK'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`} />
              </div>

              <div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-block ${statusBadge.bg}`}>
                  {dim.data.status}
                </span>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                  {dim.data.summary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
