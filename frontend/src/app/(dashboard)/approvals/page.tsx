'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { ApprovalRequest, ApprovalStatus, ApiResponse } from '@/types';
import { ApprovalRequestsList, ApprovalActionModal } from '@/features/approvals';
import { useAuth } from '@/features/auth/auth-context';
import { Loader2, FileCheck2 } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ data: ApprovalRequest[] }>>('/approvals');
      setApprovals(res.data.data.data || []);
    } catch (err) {
      console.error('Failed to load approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleActionClick = (req: ApprovalRequest, stepId: string) => {
    setSelectedRequest(req);
    setSelectedStepId(stepId);
    setActionModalOpen(true);
  };

  const handleActionSubmit = async (
    requestId: string,
    stepId: string,
    status: ApprovalStatus,
    comments?: string,
  ) => {
    await api.post(`/approvals/${requestId}/steps/${stepId}/action`, {
      status,
      comments,
    });
    await fetchApprovals();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-indigo-400" />
          Approval Workflows & Governance Queue
        </h2>
        <p className="text-sm text-slate-400">
          Review, approve, or reject pending change requests and project milestone gates
        </p>
      </div>

      <ApprovalRequestsList
        approvals={approvals}
        onActionClick={handleActionClick}
        currentUserId={user?.id || ''}
      />

      <ApprovalActionModal
        request={selectedRequest}
        stepId={selectedStepId}
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        onSubmit={handleActionSubmit}
      />
    </div>
  );
}
