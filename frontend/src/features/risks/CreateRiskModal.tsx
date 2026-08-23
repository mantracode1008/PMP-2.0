'use client';

import React, { useState } from 'react';
import { RiskCategory, RiskImpact, RiskProbability, User } from '@/types';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

interface CreateRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: RiskCategory;
    probability: RiskProbability;
    impact: RiskImpact;
    ownerId: string;
    mitigationPlan?: string;
    contingencyPlan?: string;
  }) => Promise<void>;
  members: { id: string; user?: User; userId?: string }[];
}

export const CreateRiskModal: React.FC<CreateRiskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RiskCategory>('TECHNICAL');
  const [probability, setProbability] = useState<RiskProbability>('MEDIUM');
  const [impact, setImpact] = useState<RiskImpact>('MEDIUM');
  const [ownerId, setOwnerId] = useState(members[0]?.userId || members[0]?.id || '');
  const [mitigationPlan, setMitigationPlan] = useState('');
  const [contingencyPlan, setContingencyPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ownerId) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        category,
        probability,
        impact,
        ownerId,
        mitigationPlan,
        contingencyPlan,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const PROB_WEIGHTS: Record<RiskProbability, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 };
  const IMP_WEIGHTS: Record<RiskImpact, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
  const calculatedScore = PROB_WEIGHTS[probability] * IMP_WEIGHTS[impact];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Identify Project Risk</h3>
              <p className="text-xs text-slate-500">Add a risk factor to the project risk register</p>
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
              Risk Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AWS Multi-Region failover latency spike"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Root Cause
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background and conditions that could trigger this risk..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RiskCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="TECHNICAL">Technical</option>
                <option value="SCHEDULE">Schedule</option>
                <option value="RESOURCE">Resource</option>
                <option value="BUDGET">Budget</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="EXTERNAL">External</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Risk Owner *
              </label>
              <select
                required
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {members.map((m) => {
                  const uId = m.userId || m.id;
                  const uName = m.user ? `${m.user.firstName} ${m.user.lastName}` : uId;
                  return (
                    <option key={uId} value={uId}>
                      {uName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Probability
              </label>
              <select
                value={probability}
                onChange={(e) => setProbability(e.target.value as RiskProbability)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="LOW">Low (1)</option>
                <option value="MEDIUM">Medium (2)</option>
                <option value="HIGH">High (3)</option>
                <option value="VERY_HIGH">Very High (4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as RiskImpact)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="LOW">Low (1)</option>
                <option value="MEDIUM">Medium (2)</option>
                <option value="HIGH">High (3)</option>
                <option value="CRITICAL">Critical (4)</option>
              </select>
            </div>

            <div className="flex flex-col justify-center items-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Calculated Score</span>
              <span
                className={`text-2xl font-black px-3 py-0.5 rounded-lg border mt-1 ${
                  calculatedScore >= 12
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : calculatedScore >= 8
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {calculatedScore} / 16
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mitigation Plan (Preventive Action)
            </label>
            <textarea
              rows={2}
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder="What actions are being taken to reduce probability or impact?"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Contingency Plan (Reactive Action)
            </label>
            <textarea
              rows={2}
              value={contingencyPlan}
              onChange={(e) => setContingencyPlan(e.target.value)}
              placeholder="What actions will be taken if this risk materializes?"
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
              disabled={submitting || !title || !ownerId}
              className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition-all duration-200 shadow-2xs"
            >
              {submitting ? 'Saving...' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
