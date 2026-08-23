'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { WorkloadData, WorkloadStatus, WorkloadUser } from '../../types';
import { Button } from '../../components/ui/button';
import { CapacityModal } from './capacity-modal';
import { getInitials } from '../../lib/utils';
import {
  BarChart3,
  Users,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Search,
  Settings,
  Calendar,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export function WorkloadView() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<WorkloadUser | null>(null);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  const fetchWorkload = async () => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api.get<{ data: WorkloadData }>(`/workload?limit=100${searchParam}`);
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load workload data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchWorkload();
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const getStatusPill = (status: WorkloadStatus, utilization: number) => {
    switch (status) {
      case 'OVERLOADED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="h-3 w-3" /> Overloaded ({utilization}%)
          </span>
        );
      case 'NEAR_CAPACITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Near Capacity ({utilization}%)
          </span>
        );
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="h-3 w-3" /> Healthy ({utilization}%)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Zap className="h-3 w-3" /> Available ({utilization}%)
          </span>
        );
    }
  };

  const getProgressBarColor = (status: WorkloadStatus) => {
    switch (status) {
      case 'OVERLOADED':
        return 'bg-rose-500';
      case 'NEAR_CAPACITY':
        return 'bg-amber-500';
      case 'HEALTHY':
        return 'bg-indigo-600';
      default:
        return 'bg-emerald-500';
    }
  };

  const filteredUsers = (data?.users || []).filter((u) => {
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            Resource Workload & Capacity Planning
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor team allocation, task backlog effort vs working capacity, and prevent burnout
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Team Members</span>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              {data.summary.totalUsers}
              <Users className="h-4 w-4 text-slate-400 inline" />
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">{data.summary.totalCapacityHours}h weekly capacity</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assigned Effort</span>
            <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">
              {data.summary.totalAssignedHours}h
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Estimated open workload</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actual Logged</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {data.summary.totalLoggedHours}h
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Recorded work logs</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Utilization</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {data.summary.averageUtilization}%
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">Capacity utilization</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overloaded Members</span>
            <div className="text-2xl font-black text-rose-600 mt-1 flex items-baseline gap-1.5">
              {data.summary.overloadedCount}
              {data.summary.overloadedCount > 0 && <AlertOctagon className="h-4 w-4 text-rose-500 inline" />}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">{data.summary.healthyCount} healthy, {data.summary.availableCount} available</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold w-fit">
        {[
          { id: 'ALL', label: 'All Resources' },
          { id: 'OVERLOADED', label: 'Overloaded (>120%)' },
          { id: 'NEAR_CAPACITY', label: 'Near Capacity (100-120%)' },
          { id: 'HEALTHY', label: 'Healthy (50-100%)' },
          { id: 'AVAILABLE', label: 'Available (<50%)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === tab.id
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Loading team workload metrics...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 text-sm">No members found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting search or status filters.</p>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.user.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* User Top Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold shrink-0">
                      {getInitials(u.user.firstName, u.user.lastName, u.user.email)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {u.user.firstName} {u.user.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{u.user.department?.name || 'General Team'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setIsCapacityModalOpen(true);
                    }}
                    title="Configure Working Capacity"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Pill */}
                <div className="mt-3.5 flex items-center justify-between">
                  {getStatusPill(u.status, u.utilization)}
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {u.assignedEstimatedHours}h / {u.capacity.weeklyCapacityHours}h
                  </span>
                </div>

                {/* Utilization Progress Bar */}
                <div className="mt-2 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressBarColor(u.status)}`}
                    style={{ width: `${Math.min(100, u.utilization)}%` }}
                  />
                </div>

                {/* Stats Grid */}
                <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Open Tasks</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{u.openTasksCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Overdue</span>
                    <p className={`text-xs font-bold mt-0.5 ${u.overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {u.overdueTasksCount}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Logged</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{u.actualLoggedHours}h</p>
                  </div>
                </div>
              </div>

              {/* Working Schedule Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Schedule: {u.capacity.dailyCapacityHours}h/day ({u.capacity.workingDays.length} days/wk)
                </span>
                <span className="font-semibold text-indigo-600">
                  {u.capacity.weeklyCapacityHours}h cap
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <CapacityModal
        user={selectedUser}
        isOpen={isCapacityModalOpen}
        onClose={() => {
          setIsCapacityModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchWorkload}
      />
    </div>
  );
}
