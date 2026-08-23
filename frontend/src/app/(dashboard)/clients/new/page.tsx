'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../services/api';
import { PageHeader } from '../../../../components/shared/page-header';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Button } from '../../../../components/ui/button';
import { useToast } from '../../../../components/ui/toast';
import { ApiResponse, GeneralStatus } from '../../../../types';

export default function NewClientPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<GeneralStatus>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !companyName || !email) {
      showToast('Validation Error', 'Please complete all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<ApiResponse<{ id: string }>>('/clients', {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        status,
      });

      showToast('Success', 'Client account created successfully.', 'success');
      router.push(`/clients/${res.data.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create client.';
      showToast('Error', Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Add New Client Account"
        description="Register an external client organization or partner for project governance."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clients', href: '/clients' },
          { label: 'New Client' },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company / Organization *
                </label>
                <Input
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Contact Name *
                </label>
                <Input
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (800) 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Website</label>
                <Input
                  type="url"
                  placeholder="https://acmecorp.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value as GeneralStatus)}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Business Address</label>
              <Input
                placeholder="100 Enterprise Way, Suite 400, San Francisco, CA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/clients')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Client Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
