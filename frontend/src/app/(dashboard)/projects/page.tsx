'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { PageHeader } from '../../../components/shared/page-header';
import { DataTable, Column } from '../../../components/shared/data-table';
import { StatusBadge } from '../../../components/shared/status-badge';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { formatDate } from '../../../lib/utils';
import { Briefcase, Plus, Users } from 'lucide-react';
import { ApiResponse, Project, ProjectHealth, ProjectStatus } from '../../../types';

export default function ProjectsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('');

  const canCreate = hasPermission('projects.create');

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, statusFilter, healthFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (healthFilter) params.set('health', healthFilter);

      const res = await api.get<ApiResponse<Project[]>>(`/projects?${params.toString()}`);
      return res.data;
    },
  });

  const columns: Column<Project>[] = [
    {
      header: 'Project Code & Name',
      cell: (p) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {p.code}
            </span>
            <Link
              href={`/projects/${p.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              {p.name}
            </Link>
          </div>
          {p.description && (
            <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Client',
      cell: (p) => (
        <span className="text-sm font-medium text-slate-700">
          {p.client?.companyName || '—'}
        </span>
      ),
    },
    {
      header: 'Health',
      cell: (p) => <StatusBadge status={p.health} type="health" />,
    },
    {
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} type="project" />,
    },
    {
      header: 'Target Date',
      cell: (p) => <span className="text-xs text-slate-500">{formatDate(p.targetDate)}</span>,
    },
    {
      header: 'Members',
      cell: (p) => (
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{p.memberCount ?? 0}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: (p) => (
        <Link href={`/projects/${p.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Manage
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Monitor, manage, and deliver organizational and client projects."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Projects' }]}
        action={
          canCreate && (
            <Link href="/projects/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> New Project
              </Button>
            </Link>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        searchPlaceholder="Search by name, code or description..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        emptyTitle="No projects found"
        emptyDescription="Get started by creating your first project."
        emptyActionLabel={canCreate ? 'Create Project' : undefined}
        onEmptyAction={() => (window.location.href = '/projects/new')}
        filterComponent={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs w-36"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>

            <Select
              value={healthFilter}
              onChange={(e) => {
                setHealthFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs w-36"
            >
              <option value="">All Health</option>
              <option value="HEALTHY">Healthy</option>
              <option value="AT_RISK">At Risk</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
        }
      />
    </div>
  );
}
