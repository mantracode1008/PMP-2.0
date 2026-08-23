'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useToast } from '../../../components/ui/toast';
import { Shield, ShieldCheck, Plus, Check, Lock, Edit3 } from 'lucide-react';
import { ApiResponse, Permission, Role } from '../../../types';

export default function RolesPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);

  // New role states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  const canManageRoles = hasPermission('roles.manage');

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles-detail'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Role[]>>('/roles');
      return res.data.data;
    },
  });

  const { data: permissionsGrouped } = useQuery({
    queryKey: ['permissions-grouped'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Record<string, Permission[]>>>('/permissions/grouped');
      return res.data.data;
    },
    enabled: !!selectedRoleForPermissions || isCreateRoleOpen,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleForPermissions) return;
      await api.put(`/roles/${selectedRoleForPermissions.id}/permissions`, {
        permissionIds: selectedPermissionIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-detail'] });
      showToast('Success', 'Role permissions updated.', 'success');
      setSelectedRoleForPermissions(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update permissions.', 'error');
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/roles', {
        name: newRoleName.trim().toUpperCase(),
        displayName: newRoleDisplayName.trim(),
        description: newRoleDescription.trim() || undefined,
        permissionIds: selectedPermissionIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles-detail'] });
      showToast('Success', 'Custom role created successfully.', 'success');
      setIsCreateRoleOpen(false);
      setNewRoleName('');
      setNewRoleDisplayName('');
      setNewRoleDescription('');
      setSelectedPermissionIds([]);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to create role.', 'error');
    },
  });

  const handleOpenPermissionsEditor = (role: Role) => {
    setSelectedRoleForPermissions(role);
    const existingIds = role.rolePermissions?.map((rp) => rp.permission.id) || [];
    setSelectedPermissionIds(existingIds);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId],
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Authorization"
        description="Configure system roles, fine-grained resource permissions, and operational access boundaries."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Roles & Access' }]}
        action={
          <div className="flex items-center gap-2">
            <Link href="/permissions">
              <Button variant="outline" size="sm">
                View System Permissions
              </Button>
            </Link>
            {canManageRoles && (
              <Button size="sm" onClick={() => { setIsCreateRoleOpen(true); setSelectedPermissionIds([]); }}>
                <Plus className="mr-1.5 h-4 w-4" /> Create Custom Role
              </Button>
            )}
          </div>
        }
      />

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles?.map((role) => {
          const isSuper = role.name === 'SUPER_ADMIN';
          const permCount = isSuper ? 'All (Wildcard)' : role.rolePermissions?.length || 0;

          return (
            <Card key={role.id} className="flex flex-col justify-between hover:border-slate-300 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  {role.isSystem ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Lock className="h-3 w-3" /> System Role
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Custom Role
                    </span>
                  )}
                </div>

                <CardTitle className="text-base mt-4">{role.displayName}</CardTitle>
                <p className="text-xs font-mono text-slate-400">{role.name}</p>
                <CardDescription className="text-xs pt-1">
                  {role.description || 'Standard system authorization boundary.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                  <span className="text-slate-500">Active Permissions</span>
                  <span className="font-semibold text-slate-900">{permCount}</span>
                </div>

                <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100">
                  <span className="text-slate-500">Assigned Users</span>
                  <span className="font-semibold text-slate-900">{role._count?.userRoles ?? 0}</span>
                </div>

                {canManageRoles && !isSuper && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleOpenPermissionsEditor(role)}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Permission Set
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Permissions Matrix Modal */}
      <Dialog
        isOpen={!!selectedRoleForPermissions}
        onClose={() => setSelectedRoleForPermissions(null)}
        title={`Edit Permissions: ${selectedRoleForPermissions?.displayName}`}
        description="Select the granular permissions granted to users assigned this role."
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {permissionsGrouped &&
            Object.entries(permissionsGrouped).map(([moduleName, perms]) => (
              <div key={moduleName} className="rounded-xl border border-slate-200/80 p-4 bg-slate-50/40 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 capitalize">
                  {moduleName} Module
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {perms.map((p) => {
                    const isChecked = selectedPermissionIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePermission(p.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-indigo-300 shadow-2xs text-slate-900'
                            : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 ${
                            isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="font-semibold">{p.code}</p>
                          <p className="text-[11px] text-slate-500">{p.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedRoleForPermissions(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => updatePermissionsMutation.mutate()} isLoading={updatePermissionsMutation.isPending}>
            Save Permission Matrix
          </Button>
        </div>
      </Dialog>

      {/* Create Custom Role Modal */}
      <Dialog
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        title="Create Custom Role"
        description="Establish a new role with specific operational permissions."
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createRoleMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Key (Identifier) *</label>
              <Input
                placeholder="e.g. QA_ENGINEER"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Title *</label>
              <Input
                placeholder="e.g. Quality Engineer"
                value={newRoleDisplayName}
                onChange={(e) => setNewRoleDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <Textarea
              placeholder="Role responsibilities and operational authority..."
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Assign Permissions</label>
            <div className="max-h-48 overflow-y-auto space-y-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
              {permissionsGrouped &&
                Object.entries(permissionsGrouped).map(([moduleName, perms]) => (
                  <div key={moduleName} className="space-y-1">
                    <p className="text-[11px] font-bold uppercase text-slate-500">{moduleName}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {perms.map((p) => {
                        const isChecked = selectedPermissionIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => togglePermission(p.id)}
                            className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer ${
                              isChecked ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'bg-white text-slate-600'
                            }`}
                          >
                            <div
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <span className="truncate">{p.code}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateRoleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createRoleMutation.isPending}>
              Create Role
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
