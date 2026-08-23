'use client';

import React, { useState } from 'react';
import { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from '@/types';
import {
  FileDiff,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface ChangeRequestListProps {
  changeRequests: ChangeRequest[];
  onCreateCR: () => void;
  onSelectCR: (cr: ChangeRequest) => void;
  onSubmitCR?: (crId: string) => Promise<void>;
  onImplementCR?: (crId: string) => Promise<void>;
  currentUserId: string;
}

export const ChangeRequestList: React.FC<ChangeRequestListProps> = ({
  changeRequests,
  onCreateCR,
  onSelectCR,
  onSubmitCR,
  onImplementCR,
  currentUserId,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = changeRequests.filter((cr) => {
    if (statusFilter !== 'ALL' && cr.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: ChangeRequestStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IMPLEMENTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REJECTED':
      case 'CANCELLED':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="IMPLEMENTED">Implemented</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onCreateCR}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all duration-200 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Change Request
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4"># CR</th>
                <th className="py-3 px-4">Title & Scope</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Schedule Impact</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileDiff className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No change requests match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((cr) => (
                  <tr
                    key={cr.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectCR(cr)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-purple-600">
                      CR-{cr.requestNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        {cr.title}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {cr.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                        {cr.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {cr.scheduleImpactDays !== null && cr.scheduleImpactDays !== undefined ? (
                        <span className="font-mono font-semibold text-amber-600">
                          +{cr.scheduleImpactDays} days
                        </span>
                      ) : (
                        <span className="text-slate-400">No shift</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cr.requestedBy ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {cr.requestedBy.firstName} {cr.requestedBy.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          cr.status,
                        )}`}
                      >
                        {cr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {cr.status === 'DRAFT' && onSubmitCR && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSubmitCR(cr.id);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-colors mr-2 flex items-center gap-1 inline-flex cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          Submit
                        </button>
                      )}
                      {cr.status === 'APPROVED' && onImplementCR && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onImplementCR(cr.id);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors mr-2 flex items-center gap-1 inline-flex cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          Implement
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 inline group-hover:text-purple-600 transition-colors" />
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
