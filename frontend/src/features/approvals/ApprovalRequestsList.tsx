'use client';

import React, { useState } from 'react';
import { ApprovalRequest, ApprovalStatus } from '@/types';
import {
  CheckSquare,
  Clock,
  User as UserIcon,
  ChevronRight,
  ShieldCheck,
  XCircle,
  FileDiff,
  Calendar,
} from 'lucide-react';

interface ApprovalRequestsListProps {
  approvals: ApprovalRequest[];
  onActionClick: (request: ApprovalRequest, stepId: string) => void;
  currentUserId: string;
}

export const ApprovalRequestsList: React.FC<ApprovalRequestsListProps> = ({
  approvals,
  onActionClick,
  currentUserId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const filtered = approvals.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
      case 'CANCELLED':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Action</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            No approval requests found for this filter.
          </div>
        ) : (
          filtered.map((req) => {
            const activeStep = req.steps.find((s) => s.stepOrder === req.currentStep);
            const isRequester = req.requestedById === currentUserId;

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <FileDiff className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600">
                          {req.entityType}
                        </span>
                        {req.project && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 border border-slate-200">
                            {req.project.name} ({req.project.code})
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            req.status,
                          )}`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 mt-1">
                        {req.changeRequest?.title || `Approval Request #${req.id.slice(0, 8)}`}
                      </h4>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {req.status === 'PENDING' && activeStep && (
                    <div>
                      {isRequester ? (
                        <span className="text-xs text-amber-700 italic bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                          Self-approval restricted (Waiting on other reviewers)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onActionClick(req, activeStep.id)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          Review & Action Step {req.currentStep} of {req.totalSteps}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Steps Timeline */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  {req.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                        step.status === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : step.status === 'REJECTED'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : step.stepOrder === req.currentStep
                          ? 'bg-amber-50 border-amber-200 text-amber-700 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
                        {step.stepOrder}
                      </span>
                      <span>
                        {step.status === 'APPROVED'
                          ? `Approved by ${step.actionBy?.firstName || 'Approver'}`
                          : step.status === 'REJECTED'
                          ? `Rejected by ${step.actionBy?.firstName || 'Approver'}`
                          : `Step ${step.stepOrder}: Pending Review`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
