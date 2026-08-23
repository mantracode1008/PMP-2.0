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
import { formatDate } from '../../../../lib/utils';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Edit2,
  Archive,
  ArrowUpRight,
} from 'lucide-react';
import { ApiResponse, Client, GeneralStatus } from '../../../../types';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<GeneralStatus>('ACTIVE');

  const canUpdate = hasPermission('clients.update');
  const canDelete = hasPermission('clients.delete');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Client>>(`/clients/${id}`);
      const data = res.data.data;
      setEditName(data.name);
      setEditCompanyName(data.companyName);
      setEditEmail(data.email);
      setEditPhone(data.phone || '');
      setEditWebsite(data.website || '');
      setEditAddress(data.address || '');
      setEditStatus(data.status);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/clients/${id}`, {
        name: editName,
        companyName: editCompanyName,
        email: editEmail,
        phone: editPhone || undefined,
        website: editWebsite || undefined,
        address: editAddress || undefined,
        status: editStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showToast('Success', 'Client details updated.', 'success');
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to update client.', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      showToast('Success', 'Client archived.', 'success');
      router.push('/clients');
    },
    onError: (err: any) => {
      showToast('Error', err.response?.data?.message || 'Failed to archive client.', 'error');
    },
  });

  if (isLoading || !client) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title={client.companyName}
        description={`Client Account • Primary Representative: ${client.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clients', href: '/clients' },
          { label: client.companyName },
        ]}
        action={
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit Account
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
        {/* Left Column: Account Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Account Overview</CardTitle>
              <StatusBadge status={client.status} type="general" />
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-3">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email
                </span>
                <span className="font-medium text-slate-900">{client.email}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> Phone
                </span>
                <span className="font-medium text-slate-900">{client.phone || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" /> Website
                </span>
                {client.website ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Visit <ArrowUpRight className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>

              <div className="py-1.5">
                <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" /> Address
                </span>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {client.address || 'No physical address on record.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Commissioned Projects */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Commissioned Projects</CardTitle>
                <CardDescription>All project engagements registered under this account</CardDescription>
              </div>
              <Briefcase className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3">
              {client.projects && client.projects.length > 0 ? (
                client.projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-white border text-slate-700">
                          {p.code}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                          {p.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Manager: {p.owner?.firstName} {p.owner?.lastName} • Target: {formatDate(p.targetDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.health} type="health" />
                      <StatusBadge status={p.status} type="project" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No projects registered under this client.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Client Modal */}
      <Dialog isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Client Account" maxWidth="md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
              <Input value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
              <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as GeneralStatus)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
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
        title="Archive Client Account"
        description="Are you sure you want to archive this client? Existing historical project records will be retained."
        confirmLabel="Archive Client"
        isDestructive
        isLoading={archiveMutation.isPending}
      />
    </div>
  );
}
