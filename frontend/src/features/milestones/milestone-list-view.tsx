'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../auth/auth-context';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/shared/status-badge';
import { ConfirmDialog } from '../../components/shared/confirm-dialog';
import { useToast } from '../../components/ui/toast';
import { formatDate } from '../../lib/utils';
import {
  Flag,
  Plus,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import { Milestone, MilestoneStatus } from '../../types';

interface MilestoneListViewProps {
  milestones: Milestone[];
  projectId: string;
  isLoading: boolean;
  onAddMilestone: () => void;
  onEditMilestone: (milestone: Milestone) => void;
}

const milestoneStatusBadge = (status: MilestoneStatus) => {
  switch (status) {
    case 'COMPLETED':
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
    case 'IN_PROGRESS':
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">In Progress</span>;
    case 'IN_REVIEW':
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">In Review</span>;
    case 'DELAYED':
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">Delayed</span>;
    default:
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">Not Started</span>;
  }
};

export const MilestoneListView: React.FC<MilestoneListViewProps> = ({
  milestones,
  projectId,
  isLoading,
  onAddMilestone,
  onEditMilestone,
}) => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [milestoneToArchive, setMilestoneToArchive] = useState<Milestone | null>(null);

  const canManage = hasPermission('milestones.update') || hasPermission('milestones.create');

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/milestones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      showToast('Success', 'Milestone archived.', 'success');
      setMilestoneToArchive(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive milestone.', 'error');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Project Delivery Milestones</h3>
          <p className="text-xs text-slate-500">Key delivery commitments, checkpoints, and release phases</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={onAddMilestone}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Milestone
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <Flag className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No Milestones Defined</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Break down this project into key delivery phases to track strategic progress.
          </p>
          {canManage && (
            <Button size="sm" onClick={onAddMilestone}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Milestone
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {milestones.map((m) => (
            <Card key={m.id} className="hover:border-slate-300 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <Flag className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{m.name}</h4>
                      {milestoneStatusBadge(m.status)}
                    </div>
                    {m.description && (
                      <p className="text-xs text-slate-600 pl-9 max-w-2xl leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata and Controls */}
                  <div className="flex items-center gap-4 shrink-0 pl-9 sm:pl-0 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{m.taskCount ?? 0} tasks linked</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Due {formatDate(m.dueDate)}</span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => onEditMilestone(m)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => setMilestoneToArchive(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={!!milestoneToArchive}
        onClose={() => setMilestoneToArchive(null)}
        onConfirm={() => milestoneToArchive && archiveMutation.mutate(milestoneToArchive.id)}
        title="Archive Milestone"
        description={`Are you sure you want to archive "${milestoneToArchive?.name}"? Linked tasks will not be deleted.`}
        confirmLabel="Archive Milestone"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
};
