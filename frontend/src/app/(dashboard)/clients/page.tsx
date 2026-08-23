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
import { Building2, Plus, Briefcase, Globe, Mail } from 'lucide-react';
import { ApiResponse, Client } from '../../../types';

export default function ClientsPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const canCreate = hasPermission('clients.create');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get<ApiResponse<Client[]>>(`/clients?${params.toString()}`);
      return res.data;
    },
  });

  const columns: Column<Client>[] = [
    {
      header: 'Company / Client Name',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <Link
              href={`/clients/${c.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              {c.companyName}
            </Link>
            <p className="text-xs text-slate-500">{c.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      cell: (c) => (
        <div className="space-y-0.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>{c.email}</span>
          </div>
          {c.website && (
            <div className="flex items-center gap-1.5 text-indigo-600 hover:underline">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <a href={c.website} target="_blank" rel="noreferrer">
                {c.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Projects',
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
          <span>{c.projectCount ?? 0} active</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (c) => <StatusBadge status={c.status} type="general" />,
    },
    {
      header: 'Action',
      cell: (c) => (
        <Link href={`/clients/${c.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            View Account
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Accounts"
        description="Manage organizational accounts, business contacts, and client-commissioned project portfolios."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients' }]}
        action={
          canCreate && (
            <Link href="/clients/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> New Client
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
        searchPlaceholder="Search by company, contact name or email..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        emptyTitle="No client accounts found"
        emptyDescription="Add clients to start linking projects and stakeholders."
        emptyActionLabel={canCreate ? 'Add Client' : undefined}
        onEmptyAction={() => (window.location.href = '/clients/new')}
        filterComponent={
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs w-36"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        }
      />
    </div>
  );
}
