'use client';

import React, { useState } from 'react';
import { Risk, RiskStatus, RiskCategory, RiskProbability, RiskImpact } from '@/types';
import {
  AlertTriangle,
  Plus,
  Shield,
  Clock,
  User as UserIcon,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface RiskListProps {
  risks: Risk[];
  onCreateRisk: () => void;
  onSelectRisk: (risk: Risk) => void;
  onStatusChange?: (riskId: string, status: RiskStatus) => void;
}

export const RiskList: React.FC<RiskListProps> = ({
  risks,
  onCreateRisk,
  onSelectRisk,
  onStatusChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredRisks = risks.filter((r) => {
    if (filterCategory !== 'ALL' && r.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    return true;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 12) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (score >= 8) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (score >= 4) {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getStatusBadge = (status: RiskStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MONITORING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MITIGATED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ACCEPTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CLOSED':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MONITORING">Monitoring</option>
            <option value="MITIGATED">Mitigated</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="TECHNICAL">Technical</option>
            <option value="SCHEDULE">Schedule</option>
            <option value="RESOURCE">Resource</option>
            <option value="BUDGET">Budget</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="EXTERNAL">External</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onCreateRisk}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all duration-200 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Risk
        </button>
      </div>

      {/* Risks Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Risk Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Probability / Impact</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No risks match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectRisk(risk)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      RSK-{risk.riskNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                        {risk.title}
                      </div>
                      {risk.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {risk.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                        {risk.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBadge(
                          risk.riskScore,
                        )}`}
                      >
                        {risk.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700">
                        P: <span className="font-medium">{risk.probability}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        I: <span className="font-medium">{risk.impact}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {risk.owner ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {risk.owner.firstName} {risk.owner.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          risk.status,
                        )}`}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline group-hover:text-amber-600 transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
