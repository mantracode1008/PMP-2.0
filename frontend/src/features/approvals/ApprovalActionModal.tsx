'use client';

import React, { useState } from 'react';
import { ApprovalRequest, ApprovalStatus } from '@/types';
import { X, CheckSquare, CheckCircle2, XCircle } from 'lucide-react';

interface ApprovalActionModalProps {
  request: ApprovalRequest | null;
  stepId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestId: string, stepId: string, status: ApprovalStatus, comments?: string) => Promise<void>;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  request,
  stepId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = useState<ApprovalStatus>('APPROVED');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !request || !stepId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(request.id, stepId, status, comments || undefined);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Review Approval Step</h3>
              <p className="text-xs text-slate-500">{request.entityType} • Step {request.currentStep} of {request.totalSteps}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {request.changeRequest && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-slate-900 text-sm">{request.changeRequest.title}</div>
              <div className="text-slate-500">{request.changeRequest.description}</div>
              <div className="text-slate-700 font-medium">Justification: {request.changeRequest.reason}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Decision *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('APPROVED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  status === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Approve Step
              </button>

              <button
                type="button"
                onClick={() => setStatus('REJECTED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  status === 'REJECTED'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reviewer Notes / Feedback {status === 'REJECTED' && '*'}
            </label>
            <textarea
              rows={3}
              required={status === 'REJECTED'}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add audit comments or reasons for rejection..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (status === 'REJECTED' && !comments.trim())}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-all duration-200 shadow-2xs cursor-pointer ${
                status === 'APPROVED'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {submitting ? 'Submitting...' : `Submit ${status}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
