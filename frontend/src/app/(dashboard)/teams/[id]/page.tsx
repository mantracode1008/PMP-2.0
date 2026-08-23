'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../components/ui/toast';
import { getInitials } from '../../../../lib/utils';
import {
  Users2,
  Building,
  User,
  Plus,
  Trash2,
  Edit2,
  Archive,
} from 'lucide-react';
import { ApiResponse, Department, Team, TeamMemberRole, User as UserType } from '../../../../types';

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editTeamLeadId, setEditTeamLeadId] = useState('');

  // Add member states
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<TeamMemberRole>('MEMBER');

  const canUpdate = hasPermission('teams.update');
  const canDelete = hasPermission('teams.delete');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Team>>(`/teams/${id}`);
      const data = res.data.data;
      setEditName(data.name);
      setEditDescription(data.description || '');
      setEditDepartmentId(data.department?.id || '');
      setEditTeamLeadId(data.teamLead?.id || '');
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

  const { data: allUsers } = useQuery({
    queryKey: ['all-users-team'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserType[]>>('/users?limit=100');
      return res.data.data;
    },
    enabled: isEditOpen || isAddMemberOpen,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/teams/${id}`, {
        name: editName,
        description: editDescription || undefined,
        departmentId: editDepartmentId || null,
        teamLeadId: editTeamLeadId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showToast('Success', 'Team information updated.', 'success');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update team.', 'error');
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/teams/${id}/members`, {
        userId: newUserId,
        role: newRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      showToast('Success', 'Member added to team.', 'success');
      setIsAddMemberOpen(false);
      setNewUserId('');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to add member.', 'error');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/teams/${id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      showToast('Success', 'Member removed from team.', 'success');
      setMemberToRemove(null);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to remove member.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${id}`);
    },
    onSuccess: () => {
      showToast('Success', 'Team archived.', 'success');
      router.push('/teams');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive team.', 'error');
    },
  });

  if (isLoading || !team) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const existingMemberIds = new Set(team.members?.map((m) => m.user.id) || []);
  const availableUsers = allUsers?.filter((u) => !existingMemberIds.has(u.id)) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title={team.name}
        description={team.description || 'Dedicated organizational delivery squad'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Teams', href: '/teams' },
          { label: team.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Team
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</p>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="h-4 w-4 text-slate-400" />
              {team.department?.name || 'Cross-Departmental'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Team Lead</p>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
              <User className="h-4 w-4 text-indigo-600" />
              {team.teamLead ? `${team.teamLead.firstName} ${team.teamLead.lastName}` : 'Unassigned'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <StatusBadge status={team.status} type="general" />
          </CardContent>
        </Card>
      </div>

      {/* Team Roster */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Team Roster</CardTitle>
            <CardDescription>{team.members?.length || 0} active members in squad</CardDescription>
          </div>
          {canUpdate && (
            <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {getInitials(member.user.firstName, member.user.lastName, member.user.email)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                    {member.role}
                  </span>
                  {canUpdate && (
                    <button
                      onClick={() => setMemberToRemove(member.user.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No members assigned to this team yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Team Modal */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Team Information" maxWidth="md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name *</label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <Select value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value)}>
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
              <Select value={editTeamLeadId} onChange={(e) => setEditTeamLeadId(e.target.value)}>
                <option value="">Unassigned</option>
                {allUsers?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
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

      {/* Add Member Modal */}
      <Dialog isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add Team Member" maxWidth="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newUserId) {
              showToast('Error', 'Please select a user.', 'error');
              return;
            }
            addMemberMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select User *</label>
            <Select value={newUserId} onChange={(e) => setNewUserId(e.target.value)} required>
              <option value="">Choose user...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role in Team</label>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value as TeamMemberRole)}>
              <option value="MEMBER">Member (Standard)</option>
              <option value="LEAD">Lead (Squad Lead)</option>
              <option value="CONTRIBUTOR">Contributor (Ad-hoc)</option>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={addMemberMutation.isPending}>
              Add to Team
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => memberToRemove && removeMemberMutation.mutate(memberToRemove)}
        title="Remove Team Member"
        description="Are you sure you want to remove this user from the squad roster?"
        confirmLabel="Remove"
        isDestructive
        isLoading={removeMemberMutation.isPending}
      />

      {/* Archive Team Confirmation */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => archiveMutation.mutate()}
        title="Archive Team"
        description="Are you sure you want to archive this squad?"
        confirmLabel="Archive Team"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
