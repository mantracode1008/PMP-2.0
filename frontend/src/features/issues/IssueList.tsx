'use client';

import React, { useState } from 'react';
import { Issue, IssueSeverity, IssueStatus, IssueType } from '@/types';
import {
  AlertCircle,
  Plus,
  CheckCircle,
  ChevronRight,
  Clock,
  User as UserIcon,
  Tag,
  Link2,
} from 'lucide-react';

interface IssueListProps {
  issues: Issue[];
  onCreateIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
  onResolveIssue: (issue: Issue) => void;
}

export const IssueList: React.FC<IssueListProps> = ({
  issues,
  onCreateIssue,
  onSelectIssue,
  onResolveIssue,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filtered = issues.filter((i) => {
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
    return true;
  });

  const getSeverityBadge = (sev: IssueSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'LOW':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onCreateIssue}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all duration-200 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Issues Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">Issue Summary</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Severity</th>
                <th className="py-3 px-4">Linked Item</th>
                <th className="py-3 px-4">Assignee / Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    No issues found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectIssue(issue)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      ISS-{issue.issueNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {issue.title}
                      </div>
                      {issue.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {issue.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                        {issue.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(
                          issue.severity,
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {issue.task ? (
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                          <Link2 className="w-3 h-3" />
                          <span>TSK-{issue.task.taskNumber}</span>
                        </div>
                      ) : issue.risk ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                          <Link2 className="w-3 h-3" />
                          <span>RSK-{issue.risk.riskNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {issue.owner ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {issue.owner.firstName} {issue.owner.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          issue.status,
                        )}`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {issue.status !== 'RESOLVED' && issue.status !== 'CLOSED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResolveIssue(issue);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors mr-2 cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 inline group-hover:text-indigo-600 transition-colors" />
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
