'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { PageHeader } from '../../../../components/shared/page-header';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Select } from '../../../../components/ui/select';
import { Button } from '../../../../components/ui/button';
import { useToast } from '../../../../components/ui/toast';
import { ApiResponse, Client, User } from '../../../../types';

export default function NewProjectPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [status, setStatus] = useState('PLANNING');
  const [health, setHealth] = useState('HEALTHY');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients for dropdown
  const { data: clientsData } = useQuery({
    queryKey: ['clients-list-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Client[]>>('/clients?limit=100');
      return res.data.data;
    },
  });

  // Fetch users for owner/member dropdowns
  const { data: usersData } = useQuery({
    queryKey: ['users-list-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users?limit=100');
      return res.data.data;
    },
  });

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Project name is required.', 'error');
      return;
    }
    if (!clientId) {
      showToast('Validation Error', 'Please select a client.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<ApiResponse<{ id: string }>>('/projects', {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        clientId,
        ownerId: ownerId || undefined,
        status,
        health,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        memberIds: selectedMemberIds,
      });

      showToast('Success', 'Project created successfully.', 'success');
      router.push(`/projects/${res.data.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create project.';
      showToast('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Create New Project"
        description="Establish a new project workspace with client link, milestone dates, and team staffing."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Projects', href: '/projects' },
          { label: 'New Project' },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Name *
                </label>
                <Input
                  placeholder="e.g. Mobile Banking 2.0 Rewrite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Code (Optional)
                </label>
                <Input
                  placeholder="e.g. PRJ-004 (Auto if empty)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description & Objectives
              </label>
              <Textarea
                placeholder="Detail the scope, core objectives, and deliverables for this project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Commissioning Client *
                </label>
                <Select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  <option value="">Select client company...</option>
                  {clientsData?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Lead / Owner
                </label>
                <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                  <option value="">Assign project manager (Default: You)</option>
                  {usersData?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="DRAFT">Draft</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Health</label>
                <Select value={health} onChange={(e) => setHealth(e.target.value)}>
                  <option value="HEALTHY">Healthy</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Date</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>

            {/* Initial Member Staffing */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Initial Team Members
              </label>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3 space-y-1.5 bg-slate-50/50">
                {usersData?.map((u) => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-900'
                          : 'bg-white border border-slate-200/70 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{u.firstName} {u.lastName}</span>
                        <span className="text-slate-400">({u.email})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {isSelected ? 'Assigned' : '+ Add'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/projects')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
