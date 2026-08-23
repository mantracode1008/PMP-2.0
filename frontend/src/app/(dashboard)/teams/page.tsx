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
import { Dialog } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select } from '../../../components/ui/select';
import { useToast } from '../../../components/ui/toast';
import { Users2, Plus, Building, User, Edit2 } from 'lucide-react';
import { ApiResponse, Department, Team, User as UserType } from '../../../types';

export default function TeamsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [teamLeadId, setTeamLeadId] = useState('');

  const canCreate = hasPermission('teams.create');

  const { data, isLoading } = useQuery({
    queryKey: ['teams', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);

      const res = await api.get<ApiResponse<Team[]>>(`/teams?${params.toString()}`);
      return res.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-dropdown'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Department[]>>('/departments?limit=50');
      return res.data.data;
    },
    enabled: isCreateOpen,
  });

  const { data: users } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserType[]>>('/users?limit=100');
      return res.data.data;
    },
    enabled: isCreateOpen,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/teams', {
        name: name.trim(),
        description: description.trim() || undefined,
        departmentId: departmentId || undefined,
        teamLeadId: teamLeadId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Success', 'Team created successfully.', 'success');
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setDepartmentId('');
      setTeamLeadId('');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create team.', 'error');
    },
  });

  const columns: Column<Team>[] = [
    {
      header: 'Team Name',
      cell: (t) => (
        <div>
          <Link
            href={`/teams/${t.id}`}
            className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
          >
            {t.name}
          </Link>
          {t.description && <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>}
        </div>
      ),
    },
    {
      header: 'Department',
      cell: (t) => (
        <span className="text-sm font-medium text-slate-700">
          {t.department?.name || 'Cross-Functional'}
        </span>
      ),
    },
    {
      header: 'Team Lead',
      cell: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <User className="h-3.5 w-3.5 text-indigo-600" />
          <span>{t.teamLead ? `${t.teamLead.firstName} ${t.teamLead.lastName}` : 'Unassigned'}</span>
        </div>
      ),
    },
    {
      header: 'Members',
      cell: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Users2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{t.memberCount ?? 0} members</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (t) => <StatusBadge status={t.status} type="general" />,
    },
    {
      header: 'Action',
      cell: (t) => (
        <Link href={`/teams/${t.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Manage Roster
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams & Squads"
        description="Organize people into functional delivery teams, manage squad leadership, and staffing."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Teams' }]}
        action={
          canCreate && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Team
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        searchPlaceholder="Search teams by name..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        emptyTitle="No teams found"
        emptyDescription="Create your first team to organize members."
        emptyActionLabel={canCreate ? 'Create Team' : undefined}
        onEmptyAction={() => setIsCreateOpen(true)}
      />

      {/* Create Team Modal */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Team" maxWidth="md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name *</label>
            <Input
              placeholder="e.g. Platform Infrastructure Core"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <Textarea
              placeholder="Responsibilities, domain ownership, and focus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Cross-Departmental</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Team Lead</label>
              <Select value={teamLeadId} onChange={(e) => setTeamLeadId(e.target.value)}>
                <option value="">Choose team lead...</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
