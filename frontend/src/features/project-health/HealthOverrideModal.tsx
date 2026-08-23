'use client';

import React, { useState } from 'react';
import { ProjectHealth } from '@/types';
import { X, ShieldAlert } from 'lucide-react';

interface HealthOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (health: ProjectHealth, reason: string) => Promise<void>;
  currentHealth: ProjectHealth;
}

export const HealthOverrideModal: React.FC<HealthOverrideModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentHealth,
}) => {
  const [health, setHealth] = useState<ProjectHealth>(currentHealth);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(health, reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manual Health Override</h3>
              <p className="text-xs text-slate-500">Set executive governance status</p>
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
              Override Health Status *
            </label>
            <select
              value={health}
              onChange={(e) => setHealth(e.target.value as ProjectHealth)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="HEALTHY">Healthy (On Track)</option>
              <option value="AT_RISK">At Risk (Needs Attention)</option>
              <option value="CRITICAL">Critical (Blocked / Escalation Required)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Audit Reason *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the business context or stakeholder justification for this override..."
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
              disabled={submitting || !reason.trim()}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-2xs"
            >
              {submitting ? 'Applying...' : 'Apply Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
