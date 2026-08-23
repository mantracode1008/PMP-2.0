'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { formatDate, getInitials } from '../../lib/utils';
import {
  Activity,
  User,
  PlusCircle,
  Edit,
  Trash,
  Upload,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ActivityLogItem, ApiResponse } from '../../types';

interface ActivityTimelineViewProps {
  projectId: string;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'CREATE':
      return <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />;
    case 'UPDATE':
    case 'STATUS_CHANGE':
      return <Edit className="h-3.5 w-3.5 text-blue-600" />;
    case 'DELETE':
      return <Trash className="h-3.5 w-3.5 text-rose-600" />;
    case 'UPLOAD':
      return <Upload className="h-3.5 w-3.5 text-purple-600" />;
    default:
      return <Activity className="h-3.5 w-3.5 text-slate-500" />;
  }
};

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({ projectId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', projectId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ActivityLogItem[]>>(`/activity-logs?limit=50`);
      return res.data.data;
    },
  });

  const logs = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Project Activity Stream</h3>
        <p className="text-xs text-slate-500">Live chronological record of team operations and state changes</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-slate-400 py-12 text-center">No recorded activity logs yet.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {logs.map((log) => (
            <div key={log.id} className="relative flex items-start gap-3 text-xs">
              {/* Dot */}
              <div className="absolute -left-6 mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-300 shadow-2xs">
                {getActionIcon(log.action)}
              </div>

              <div className="flex-1 bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs hover:border-indigo-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center">
                      {getInitials(log.actor?.firstName, log.actor?.lastName, log.actor?.email)}
                    </span>
                    <span className="font-bold text-slate-900">
                      {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                    </span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="font-semibold text-indigo-600 uppercase text-[10px]">
                      {log.action} {log.entityType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                </div>

                {log.metadata && (
                  <p className="text-slate-600 mt-1 pl-7 text-[11px] leading-relaxed">
                    {typeof log.metadata === 'object'
                      ? JSON.stringify(log.metadata)
                      : String(log.metadata)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
