'use client';

import React, { useState } from 'react';
import { ChangeRequestType } from '@/types';
import { X, FileDiff } from 'lucide-react';

interface CreateChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    type: ChangeRequestType;
    reason: string;
    impactSummary?: string;
    scheduleImpactDays?: number;
    costImpact?: string;
    resourceImpact?: string;
    scopeImpact?: string;
    riskImpact?: string;
  }) => Promise<void>;
}

export const CreateChangeRequestModal: React.FC<CreateChangeRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ChangeRequestType>('SCOPE');
  const [reason, setReason] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
  const [scheduleImpactDays, setScheduleImpactDays] = useState<number | undefined>(undefined);
  const [costImpact, setCostImpact] = useState('');
  const [resourceImpact, setResourceImpact] = useState('');
  const [scopeImpact, setScopeImpact] = useState('');
  const [riskImpact, setRiskImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !reason) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        type,
        reason,
        impactSummary,
        scheduleImpactDays: scheduleImpactDays ? Number(scheduleImpactDays) : undefined,
        costImpact,
        resourceImpact,
        scopeImpact,
        riskImpact,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600 border border-purple-100">
              <FileDiff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create Change Request</h3>
              <p className="text-xs text-slate-500">Formally request a modification to project baseline scope/schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Change Request Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Integrate Apple Pay and Google Pay Checkout"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChangeRequestType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="SCOPE">Scope</option>
                <option value="SCHEDULE">Schedule</option>
                <option value="RESOURCE">Resource</option>
                <option value="TECHNICAL">Technical</option>
                <option value="REQUIREMENT">Requirement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Schedule Impact (Days)
              </label>
              <input
                type="number"
                value={scheduleImpactDays || ''}
                onChange={(e) => setScheduleImpactDays(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the change, requirements, and specifications in detail..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Business Justification / Reason *
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this change necessary? What is the business value?"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Resource Impact
              </label>
              <input
                type="text"
                value={resourceImpact}
                onChange={(e) => setResourceImpact(e.target.value)}
                placeholder="e.g. +1 Frontend Dev for 1 week"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cost Impact Description
              </label>
              <input
                type="text"
                value={costImpact}
                onChange={(e) => setCostImpact(e.target.value)}
                placeholder="e.g. Estimated $4,500 additional cloud usage"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
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
              disabled={submitting || !title || !description || !reason}
              className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-2xs"
            >
              {submitting ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
