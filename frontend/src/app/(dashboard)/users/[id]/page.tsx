'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../services/api';
import { useAuth } from '../../../../features/auth/auth-context';
import { PageHeader } from '../../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/shared/status-badge';
import { Dialog } from '../../../../components/ui/dialog';
import { ConfirmDialog } from '../../../../components/shared/confirm-dialog';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { useToast } from '../../../../components/ui/toast';
import { formatDate, getInitials } from '../../../../lib/utils';
import {
  Mail,
  Phone,
  Building,
  Shield,
  Briefcase,
  Users2,
  Edit2,
  Archive,
} from 'lucide-react';
import { ApiResponse, Department, Role, User, UserStatus } from '../../../../types';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // Edit states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editRole, setEditRole] = useState('');

  const canUpdate = hasPermission('users.update');
  const canDelete = hasPermission('users.delete');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>(`/users/${id}`);
      const data = res.data.data;
      setEditFirstName(data.firstName);
      setEditLastName(data.lastName);
      setEditPhone(data.phone || '');
      setEditDepartmentId(data.department?.id || '');
      setEditRole(data.roles?.[0]?.name || 'USER');
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Department[]>>('/departments?limit=50');
      return res.data.data;
    },
    enabled: isEditOpen,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Role[]>>('/roles');
      return res.data.data;
    },
    enabled: isEditOpen,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/users/${id}`, {
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone || undefined,
        departmentId: editDepartmentId || null,
        roles: [editRole],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Success', 'User profile updated.', 'success');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update user.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      showToast('Success', 'User archived.', 'success');
      router.push('/users');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive user.', 'error');
    },
  });

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={`User Profile • Joined on ${formatDate(user.createdAt)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Profile
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => setIsArchiveConfirmOpen(true)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Profile & Identity */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 text-2xl font-bold">
                {getInitials(user.firstName, user.lastName, user.email)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={user.status} type="user" />
                {user.roles?.map((r) => (
                  <span
                    key={r.id}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                  >
                    {r.displayName || r.name}
                  </span>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  <span className="font-medium text-slate-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </span>
                  <span className="font-medium text-slate-900">{user.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Building className="h-3.5 w-3.5" /> Department
                  </span>
                  <span className="font-medium text-slate-900">{user.department?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Shield className="h-3.5 w-3.5" /> Last Active
                  </span>
                  <span className="font-medium text-slate-900">{formatDate(user.lastLoginAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Cards: Teams & Projects Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Assigned Projects</CardTitle>
                <CardDescription>Projects this user is staffed on</CardDescription>
              </div>
              <Briefcase className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              {user.projects && user.projects.length > 0 ? (
                user.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white border text-slate-700">
                        {p.code}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{p.role}</span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No projects assigned.</p>
              )}
            </CardContent>
          </Card>

          {/* Teams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Team Memberships</CardTitle>
                <CardDescription>Organizational units and squads</CardDescription>
              </div>
              <Users2 className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              {user.teams && user.teams.length > 0 ? (
                user.teams.map((t) => (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all group"
                  >
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                      {t.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{t.role}</span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No team memberships found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit User Modal */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User Information" maxWidth="md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
            <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <Select value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value)}>
                <option value="">No Department</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
              <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                {roles?.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.displayName || r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => archiveMutation.mutate()}
        title="Archive User"
        description="Are you sure you want to archive this user account? They will no longer be able to log in."
        confirmLabel="Archive User"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
