'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { PageHeader } from '../../../components/shared/page-header';
import { DataTable, Column } from '../../../components/shared/data-table';
import { StatusBadge } from '../../../components/shared/status-badge';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog';
import { useToast } from '../../../components/ui/toast';
import { formatDate, getInitials } from '../../../lib/utils';
import { Plus, UserCheck, Trash2, Edit2, Shield } from 'lucide-react';
import { ApiResponse, Department, User, UserStatus } from '../../../types';

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [userToArchive, setUserToArchive] = useState<User | null>(null);

  const canCreate = hasPermission('users.create');
  const canUpdate = hasPermission('users.update');
  const canManageStatus = hasPermission('users.manage_status');
  const canDelete = hasPermission('users.delete');

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-filter'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Department[]>>('/departments?limit=50');
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, statusFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (departmentFilter) params.set('departmentId', departmentFilter);

      const res = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
      return res.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      await api.put(`/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Success', 'User status updated.', 'success');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update status.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Success', 'User archived.', 'success');
      setUserToArchive(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive user.', 'error');
    },
  });

  const columns: Column<User>[] = [
    {
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
            {getInitials(u.firstName, u.lastName, u.email)}
          </div>
          <div>
            <Link
              href={`/users/${u.id}`}
              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              {u.firstName} {u.lastName}
            </Link>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      cell: (u) => (
        <span className="text-sm font-medium text-slate-700">
          {u.department?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Roles',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles?.map((r) => (
            <span
              key={r.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-700 border border-slate-200"
            >
              <Shield className="h-3 w-3 text-slate-400" />
              {r.displayName || r.name}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (u) => (
        canManageStatus ? (
          <select
            value={u.status}
            onChange={(e) => statusMutation.mutate({ userId: u.id, status: e.target.value as UserStatus })}
            className="text-xs rounded-md border border-slate-200 bg-white px-2 py-1 font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        ) : (
          <StatusBadge status={u.status} type="user" />
        )
      ),
    },
    {
      header: 'Last Active',
      cell: (u) => <span className="text-xs text-slate-500">{formatDate(u.lastLoginAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (u) => (
        <div className="flex items-center gap-1.5">
          <Link href={`/users/${u.id}`}>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Edit2 className="h-3 w-3 mr-1" /> View
            </Button>
          </Link>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setUserToArchive(u)}
              title="Archive user"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Administer user identities, roles, departmental assignments, and status lifecycles."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        action={
          canCreate && (
            <Link href="/users/new">
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" /> Add User
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
        searchPlaceholder="Search by name or email address..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        emptyTitle="No users found"
        emptyDescription="Create team members to collaborate across projects and departments."
        emptyActionLabel={canCreate ? 'Add User' : undefined}
        onEmptyAction={() => (window.location.href = '/users/new')}
        filterComponent={
          <div className="flex items-center gap-2">
            <Select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs w-40"
            >
              <option value="">All Departments</option>
              {departmentsData?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs w-32"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={!!userToArchive}
        onClose={() => setUserToArchive(null)}
        onConfirm={() => userToArchive && archiveMutation.mutate(userToArchive.id)}
        title="Archive User Account"
        description={`Are you sure you want to archive ${userToArchive?.firstName} ${userToArchive?.lastName}? Their active sessions will be terminated.`}
        confirmLabel="Archive User"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
