'use client';

import React, { useState } from 'react';
import { ProjectClosureCheckResult } from '@/types';
import {
  X,
  Archive,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
  Bug,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';

interface ProjectClosureCheckModalProps {
  closureCheck: ProjectClosureCheckResult | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmArchive: (reason: string, policy: 'WARN' | 'BLOCK' | 'ALLOW') => Promise<void>;
}

export const ProjectClosureCheckModal: React.FC<ProjectClosureCheckModalProps> = ({
  closureCheck,
  isOpen,
  onClose,
  onConfirmArchive,
}) => {
  const [reason, setReason] = useState('');
  const [policy, setPolicy] = useState<'WARN' | 'BLOCK' | 'ALLOW'>('WARN');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !closureCheck) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await onConfirmArchive(reason.trim(), policy);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const { checks, blockersCount, warningsCount, canArchive } = closureCheck;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Project Pre-Closure Verification</h3>
              <p className="text-xs text-slate-500">{closureCheck.projectName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Readiness Summary */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              blockersCount > 0
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : warningsCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {blockersCount > 0 ? (
              <AlertOctagon className="w-6 h-6 shrink-0" />
            ) : warningsCount > 0 ? (
              <AlertTriangle className="w-6 h-6 shrink-0" />
            ) : (
              <CheckCircle2 className="w-6 h-6 shrink-0" />
            )}

            <div>
              <div className="font-bold text-sm">
                {blockersCount > 0
                  ? `${blockersCount} Critical Blockers Detected`
                  : warningsCount > 0
                  ? `${warningsCount} Warnings Found (Open tasks or risks)`
                  : 'All Closure Verification Checks Passed!'}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                {blockersCount > 0
                  ? 'Policy BLOCK requires critical issues and pending approvals to be resolved.'
                  : 'Review the items below before placing project in read-only archive.'}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Governance Checklist
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  checks.uncompletedTasks.passed
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-slate-400" />
                  <span>Uncompleted Tasks</span>
                </div>
                <span className="font-bold font-mono">{checks.uncompletedTasks.count}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  checks.criticalIssues.passed
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-slate-400" />
                  <span>Critical Issues</span>
                </div>
                <span className="font-bold font-mono">{checks.criticalIssues.count}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  checks.pendingApprovals.passed
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  <span>Pending Approvals</span>
                </div>
                <span className="font-bold font-mono">{checks.pendingApprovals.count}</span>
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  checks.openHighRisks.passed
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <span>High Risk Factors</span>
                </div>
                <span className="font-bold font-mono">{checks.openHighRisks.count}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Closure Reason & Sign-off Notes *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Completed all deliverables and client signed off on final acceptance certificate."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              disabled={submitting || !reason.trim()}
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-2xs"
            >
              {submitting ? 'Archiving...' : 'Confirm Project Archive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
