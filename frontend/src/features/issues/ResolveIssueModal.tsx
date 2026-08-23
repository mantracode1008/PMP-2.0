'use client';

import React, { useState } from 'react';
import { Issue } from '@/types';
import { X, CheckCircle } from 'lucide-react';

interface ResolveIssueModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issueId: string, resolution: string) => Promise<void>;
}

export const ResolveIssueModal: React.FC<ResolveIssueModalProps> = ({
  issue,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution) return;

    setSubmitting(true);
    try {
      await onSubmit(issue.id, resolution);
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
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Resolve Issue</h3>
              <p className="text-xs text-slate-500 font-mono">ISS-{issue.issueNumber}: {issue.title}</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Resolution Details & Root Cause Fix *
            </label>
            <textarea
              rows={4}
              required
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain how this issue was resolved and what preventive measures were implemented..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              disabled={submitting || !resolution}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-2xs"
            >
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
