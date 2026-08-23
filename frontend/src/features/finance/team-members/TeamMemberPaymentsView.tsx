'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TeamMemberPaymentsResponse,
} from '../../../types';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Users,
  Search,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface TeamMemberPaymentsViewProps {
  data: TeamMemberPaymentsResponse;
  currency?: string;
}

export function TeamMemberPaymentsView({
  data,
  currency = 'INR',
}: TeamMemberPaymentsViewProps) {
  const [search, setSearch] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  const formatMoney = (amount: number) => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const { grandTotal = 0, totalMembers = 0, members = [] } = data;

  const filteredMembers = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.user.firstName.toLowerCase().includes(q) ||
      m.user.lastName.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.projects.some((p) => p.projectName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/finance"
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Team Member Payments</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Project-level compensations, developer payouts, and contractor expenses grouped by team member.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-gray-500 block font-medium">Grand Total Paid</span>
              <span className="text-sm font-bold text-indigo-600">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name, email, or project..."
            className="pl-8 text-xs h-9 bg-white"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Showing {filteredMembers.length} of {totalMembers} team members
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">No team member payments found</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            When you record project expenses assigned to developers or team members, their cross-project breakdown will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((m) => {
            const isExpanded = expandedUsers[m.user.id] ?? true;
            return (
              <div
                key={m.user.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300"
              >
                {/* Member Header Card */}
                <div
                  onClick={() => toggleExpand(m.user.id)}
                  className="p-4 flex items-center justify-between cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                      {m.user.firstName.charAt(0)}
                      {m.user.lastName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {m.user.firstName} {m.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{m.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[11px] text-gray-500 block">Total Project Payments</span>
                      <span className="text-base font-bold text-indigo-600">{formatMoney(m.totalPaid)}</span>
                    </div>

                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-gray-500 block">Projects Involved</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {m.projects.length} {m.projects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>

                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Projects Breakdown Table */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-white">
                    <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      Project Breakdown
                    </h5>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                          <tr>
                            <th className="px-3 py-2">Project</th>
                            <th className="px-3 py-2 text-right">Amount Paid</th>
                            <th className="px-3 py-2 text-center">Expense Count</th>
                            <th className="px-3 py-2 text-right">Last Payment Date</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {m.projects.map((p) => (
                            <tr key={p.projectId} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2.5 font-medium text-gray-900">
                                <div>{p.projectName}</div>
                                <div className="text-[10px] text-gray-400">{p.projectCode}</div>
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-indigo-600">
                                {formatMoney(p.totalAmount)}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-600">{p.expenseCount} entries</td>
                              <td className="px-3 py-2.5 text-right text-gray-500">
                                {new Date(p.lastPaymentDate).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <Link
                                  href={`/projects/${p.projectId}`}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline inline-flex items-center gap-0.5"
                                >
                                  View <ArrowRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
