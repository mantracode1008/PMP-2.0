'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FinanceDashboardResponse,
  ProjectStatus,
} from '../../../types';
import { FinanceMetricsCards } from './FinanceMetricsCards';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Search,
  Filter,
  ArrowRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
} from 'lucide-react';

interface FinanceDashboardViewProps {
  data: FinanceDashboardResponse;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  page: number;
  onPageChange: (newPage: number) => void;
  onExportCsv: () => void;
  isExporting?: boolean;
}

export function FinanceDashboardView({
  data,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  page,
  onPageChange,
  onExportCsv,
  isExporting,
}: FinanceDashboardViewProps) {
  const router = useRouter();
  const { metrics, projects = [], pagination } = data;

  const formatMoney = (amount: number, currency: string = 'INR') => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PLANNING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ON_HOLD':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------- */}
      {/* 1. TOP HEADER & ACTIONS */}
      {/* ----------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Finance Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Super Admin real-time money tracking, client payments, expenses, and project profit overview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/finance/team-members">
            <Button variant="outline" className="text-xs h-9 flex items-center gap-1.5 border-gray-200">
              <Users className="w-4 h-4 text-blue-600" />
              Team Member Payments
            </Button>
          </Link>
          <Button
            onClick={onExportCsv}
            disabled={isExporting}
            variant="outline"
            className="text-xs h-9 flex items-center gap-1.5 border-gray-200"
          >
            <Download className="w-4 h-4 text-gray-600" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. GLOBAL METRICS CARDS */}
      {/* ----------------------------------------------------------- */}
      <FinanceMetricsCards metrics={metrics} />

      {/* ----------------------------------------------------------- */}
      {/* 3. PROJECT FINANCIAL OVERVIEW TABLE */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Project Financial Overview</h3>
            <p className="text-xs text-gray-500">
              {metrics.totalProjects} total projects • {metrics.projectsWithFinances} with financial values
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search project or client..."
                className="pl-8 text-xs h-8 bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-8 px-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNING">Planning</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {projects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900">No project financials found</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              {search || statusFilter
                ? 'Try adjusting your search criteria or filters.'
                : 'Projects created in the system will automatically appear here for financial tracking.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Project Value</th>
                  <th className="px-4 py-3 text-right">Received</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3 text-right">Expenses</th>
                  <th className="px-4 py-3 text-right">Current Cash</th>
                  <th className="px-4 py-3 text-right">Expected Profit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => {
                  const curr = p.currency || 'INR';
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}`)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Project Name & Code */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-gray-500">{p.code}</div>
                      </td>

                      {/* Client */}
                      <td className="px-4 py-3 text-gray-700">
                        {p.client ? p.client.companyName || p.client.name : '—'}
                      </td>

                      {/* Project Value */}
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatMoney(p.projectValue, curr)}
                      </td>

                      {/* Received */}
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatMoney(p.received, curr)}
                        {p.isFullyPaid && (
                          <span className="block text-[10px] text-emerald-600 font-normal">100% Paid</span>
                        )}
                      </td>

                      {/* Pending */}
                      <td className="px-4 py-3 text-right font-semibold text-amber-600">
                        {formatMoney(p.pending, curr)}
                      </td>

                      {/* Expenses */}
                      <td className="px-4 py-3 text-right font-semibold text-rose-600">
                        {formatMoney(p.expenses, curr)}
                      </td>

                      {/* Current Cash */}
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          p.currentCash >= 0 ? 'text-indigo-600' : 'text-red-600'
                        }`}
                      >
                        {formatMoney(p.currentCash, curr)}
                      </td>

                      {/* Expected Profit */}
                      <td
                        className={`px-4 py-3 text-right font-bold ${
                          p.expectedProfit >= 0 ? 'text-teal-600' : 'text-red-600'
                        }`}
                      >
                        {formatMoney(p.expectedProfit, curr)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            p.status,
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/projects/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Finance <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 text-xs text-gray-500">
            <span>
              Showing Page <span className="font-semibold">{pagination.page}</span> of{' '}
              <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalItems} projects)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pagination.totalPages}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
