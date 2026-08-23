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
import { User, Lock, Shield, Mail, Phone, Building } from 'lucide-react';

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
    setIsUpdatingProfile(true);
    try {
      await api.patch(`/users/${user.id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      await refreshProfile();
      showToast('Success', 'Profile updated successfully.', 'success');
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update profile.', 'error');
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
    if (newPassword.length < 8) {
      showToast('Validation Error', 'New password must be at least 8 characters long.', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showToast('Success', 'Password changed successfully. Please keep your new credentials secure.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="My Profile & Security"
        description="Manage your account profile details, credentials, and inspect active permission tokens."
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
                <h3 className="text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <StatusBadge status={user?.status} type="user" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {isSuperAdmin ? 'Super Administrator' : user?.roles?.[0]?.displayName || 'Member'}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-left text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Building className="h-3.5 w-3.5" /> Department
                  </span>
                  <span className="font-medium text-slate-900">{user?.department?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> Work Email
                  </span>
                  <span className="font-medium text-slate-900">{user?.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form & Password Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" /> Personal Information
              </CardTitle>
              <CardDescription>Update your public account profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-600" /> Change Security Password
              </CardTitle>
              <CardDescription>Ensure your account uses a strong, unique password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <Input
                      type="password"
                      placeholder="Min 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
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

          {/* Active Permission Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-indigo-600" /> Active Permissions
              </CardTitle>
              <CardDescription>Permissions granted to your current session based on assigned roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {user?.permissions?.map((p, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
