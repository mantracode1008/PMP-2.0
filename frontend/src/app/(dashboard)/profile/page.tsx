'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../features/auth/auth-context';
import api from '../../../services/api';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { StatusBadge } from '../../../components/shared/status-badge';
import { useToast } from '../../../components/ui/toast';
import { getInitials, formatDate } from '../../../lib/utils';
import { User, Lock, Mail, Phone, Building } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshProfile, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsUpdatingProfile(true);
      await api.patch(`/users/${user.id}`, {
        firstName,
        lastName,
        phone: phone || undefined,
      });
      await refreshProfile();
      showToast('Profile Updated', 'Your profile details have been saved.', 'success');
    } catch (err: any) {
      showToast('Update Failed', err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Validation Error', 'New passwords do not match.', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showToast('Password Changed', 'Your security password has been updated.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('Change Failed', err.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="My Profile & Security"
        description="Manage your account profile details and security credentials."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 text-2xl font-bold">
                {getInitials(user?.firstName, user?.lastName, user?.email)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={user?.status as any} type="user" />
                {user?.roles?.map((r: any, idx: number) => {
                  const roleName = typeof r === 'string' ? r : r.displayName || r.name;
                  const roleKey = typeof r === 'string' ? `${r}-${idx}` : (r.id || `${r.name}-${idx}`);
                  return (
                    <span
                      key={roleKey}
                      className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                    >
                      {roleName}
                    </span>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  <span className="font-medium text-slate-900">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </span>
                  <span className="font-medium text-slate-900">{user?.phone || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Building className="h-3.5 w-3.5" /> Department
                  </span>
                  <span className="font-medium text-slate-900">{user?.department?.name || 'Unassigned'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Edit Profile & Password Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" /> Personal Details
              </CardTitle>
              <CardDescription>Update your public facing profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <Input value={user?.email || ''} disabled className="bg-slate-50 cursor-not-allowed" />
                  <p className="mt-1 text-[11px] text-slate-400">Email cannot be modified directly.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-600" /> Security & Password
              </CardTitle>
              <CardDescription>Ensure your account uses a strong, unique password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                    <Input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" variant="outline" isLoading={isChangingPassword}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
