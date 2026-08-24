'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { StatusBadge } from '../../../components/shared/status-badge';
import { formatDate, formatDateTime, getInitials } from '../../../lib/utils';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  FolderGit2,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { ActivityLog, ApiResponse, Project, WeeklyTimesheetGrid, WorkloadData, DeadlineData } from '../../../types';
import { PaymentRemindersCard } from '../../../features/finance';

export default function DashboardPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  // Queries for metrics
  const { data: userMetrics } = useQuery({
    queryKey: ['user-metrics'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ totalUsers: number; activeUsers: number; totalAdmins: number }>>('/users/metrics');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: clientMetrics } = useQuery({
    queryKey: ['client-metrics'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ totalClients: number; activeClients: number }>>('/clients/metrics');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: projectMetrics } = useQuery({
    queryKey: ['project-metrics'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ totalProjects: number; activeProjects: number; planningProjects: number; health: { healthy: number; atRisk: number; critical: number } }>>('/projects/metrics');
      return res.data.data;
    },
  });

  // Phase 3: Workload query for admins
  const { data: workloadData } = useQuery({
    queryKey: ['dashboard-workload'],
    queryFn: async () => {
      const res = await api.get<{ data: WorkloadData }>('/workload');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  // Phase 3: My Timesheets for user
  const { data: myTimesheetData } = useQuery({
    queryKey: ['dashboard-my-timesheet'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyTimesheetGrid }>('/timesheets/my');
      return res.data.data;
    },
  });

  // Phase 3: Deadlines & Overdue
  const { data: deadlineData } = useQuery({
    queryKey: ['dashboard-deadlines'],
    queryFn: async () => {
      const res = await api.get<{ data: DeadlineData }>('/planning/deadlines');
      return res.data.data;
    },
  });

  // Recent Projects

  // Recent Projects
  const { data: recentProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project[]>>('/projects?limit=5&sortBy=updatedAt&sortOrder=desc');
      return res.data.data;
    },
  });

  // Recent Activity Logs (For Super Admin and Admin)
  const { data: activityLogs } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ActivityLog[]>>('/activity-logs?limit=6');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Team Member'}`}
        description={
          isSuperAdmin
            ? 'Super Administrator Command Center — Full system health, users, and organizational overview.'
            : isAdmin
            ? 'Operational Administration Dashboard — Projects health, clients, and teams overview.'
            : 'Personal Workspace — Your assigned projects, team collaboration, and recent updates.'
        }
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href="/projects/new">
                <Button size="sm">
                  <Briefcase className="mr-1.5 h-4 w-4" /> New Project
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Users
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{userMetrics?.totalUsers ?? '—'}</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">{userMetrics?.activeUsers ?? 0}</span> active in system
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Active Projects' : 'Assigned Projects'}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Briefcase className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{projectMetrics?.activeProjects ?? '—'}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">{projectMetrics?.totalProjects ?? 0}</span> total projects
            </p>
          </CardContent>
        </Card>

        {/* Phase 3: Workload & Utilization Card (For Admins) */}
        {isAdmin && workloadData?.summary && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Team Workload
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <AlertOctagon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{workloadData.summary.averageUtilization}%</div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                {workloadData.summary.overloadedCount > 0 ? (
                  <span className="font-semibold text-rose-600">{workloadData.summary.overloadedCount} overloaded</span>
                ) : (
                  <span className="font-semibold text-emerald-600">All healthy</span>
                )}{' '}
                • {workloadData.summary.totalAssignedHours}h / {workloadData.summary.totalCapacityHours}h
              </p>
            </CardContent>
          </Card>
        )}

        {/* Phase 3: My Timesheets Card (For All Users) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              This Week Logged
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {myTimesheetData?.timesheet?.weeklyTotalHours || 0}h
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Status:{' '}
              <span className="font-bold text-indigo-600">
                {myTimesheetData?.timesheet?.status || 'DRAFT'}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Phase 3: Deadlines & Overdue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Deadlines & Overdue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {deadlineData?.metrics.overdueCount || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-rose-600">{deadlineData?.metrics.overdueCount || 0} overdue</span>
              {' • '}
              <span className="font-semibold text-amber-600">{deadlineData?.metrics.dueSoonCount || 0} due soon</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Super Admin / Admin: Client Payment Due Alerts */}
      {isAdmin && (
        <PaymentRemindersCard compact={true} />
      )}

      {/* Main Grid: Projects Overview & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAdmin ? 'Active & Recent Projects' : 'My Assigned Projects'}
              </h2>
              <p className="text-xs text-slate-500">Track project milestones, health, and client engagements</p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProjects && recentProjects.length > 0 ? (
              recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-2xs transition-all gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.code}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {p.client ? `${p.client.companyName} • ` : ''}
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={p.health} type="health" />
                    <StatusBadge status={p.status} type="project" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white">
                <FolderGit2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No projects to display</p>
                <p className="text-xs text-slate-400 mt-0.5">Assigned projects will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Feed: Recent Activity or User Profile Card */}
        <div className="space-y-6">
          {isAdmin && activityLogs && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">System Activity</h2>
                  <p className="text-xs text-slate-500">Live audit log stream</p>
                </div>
                <Activity className="h-4 w-4 text-slate-400" />
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
                      {getInitials(log.actor?.firstName, log.actor?.lastName, log.actor?.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800">
                        <span className="font-semibold text-slate-900">
                          {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                        </span>{' '}
                        performed <span className="font-medium text-indigo-600">{log.action}</span> on{' '}
                        <span className="font-medium text-slate-900">{log.entityType}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Profile Overview */}
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Profile & Access</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-base">
                    {getInitials(user?.firstName, user?.lastName, user?.email)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</h4>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-medium text-slate-800">{user?.department?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Role</span>
                    <span className="font-semibold text-indigo-600">
                      {isSuperAdmin ? 'Super Administrator' : user?.roles?.[0]?.displayName || 'Member'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <StatusBadge status={user?.status} type="user" />
                  </div>
                </div>

                <Link href="/profile">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage Profile & Security
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
