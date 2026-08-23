'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { PageHeader } from '../../../components/shared/page-header';
import { DataTable, Column } from '../../../components/shared/data-table';
import { StatusBadge } from '../../../components/shared/status-badge';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
import { ConfirmDialog } from '../../../components/shared/confirm-dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/toast';
import { Building, Plus, Users, Users2, Edit2, Trash2 } from 'lucide-react';
import { ApiResponse, Department } from '../../../types';

export default function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptToArchive, setDeptToArchive] = useState<Department | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canCreate = hasPermission('departments.create');
  const canUpdate = hasPermission('departments.update');
  const canDelete = hasPermission('departments.delete');

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);

      const res = await api.get<ApiResponse<Department[]>>(`/departments?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/departments', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Success', 'Department created.', 'success');
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create department.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingDept) return;
      await api.patch(`/departments/${editingDept.id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Success', 'Department updated.', 'success');
      setEditingDept(null);
      setName('');
      setDescription('');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update department.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      showToast('Success', 'Department archived.', 'success');
      setDeptToArchive(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive department.', 'error');
    },
  });

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setDescription(dept.description || '');
  };

  const columns: Column<Department>[] = [
    {
      header: 'Department Name',
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-900">{d.name}</span>
            {d.description && <p className="text-xs text-slate-500 line-clamp-1">{d.description}</p>}
          </div>
        </div>
      ),
    },
    {
      header: 'Members',
      cell: (d) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>{d.userCount ?? 0} members</span>
        </div>
      ),
    },
    {
      header: 'Teams',
      cell: (d) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Users2 className="h-3.5 w-3.5 text-slate-400" />
          <span>{d.teamCount ?? 0} squads</span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (d) => <StatusBadge status={d.status} type="general" />,
    },
    {
      header: 'Actions',
      cell: (d) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleOpenEdit(d)}
            >
              <Edit2 className="h-3 w-3 mr-1" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 border-rose-200"
              onClick={() => setDeptToArchive(d)}
              title="Archive department"
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
        title="Departments"
        description="Structure organizational business units and functional employee hierarchies."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Departments' }]}
        action={
          canCreate && (
            <Button size="sm" onClick={() => { setIsCreateOpen(true); setName(''); setDescription(''); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Department
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        searchPlaceholder="Search departments..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onPageChange={setPage}
        emptyTitle="No departments found"
        emptyDescription="Create your first department to organize personnel."
        emptyActionLabel={canCreate ? 'Create Department' : undefined}
        onEmptyAction={() => setIsCreateOpen(true)}
      />

      {/* Create / Edit Department Modal */}
      <Dialog
        isOpen={isCreateOpen || !!editingDept}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingDept(null);
        }}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingDept) {
              updateMutation.mutate();
            } else {
              createMutation.mutate();
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
            <Input
              placeholder="e.g. Engineering, Product Design, Quality Assurance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <Textarea
              placeholder="Department domain, mandate, and organizational focus..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={!!deptToArchive}
        onClose={() => setDeptToArchive(null)}
        onConfirm={() => deptToArchive && archiveMutation.mutate(deptToArchive.id)}
        title="Archive Department"
        description={`Are you sure you want to archive ${deptToArchive?.name}? Member associations will be preserved.`}
        confirmLabel="Archive Department"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
