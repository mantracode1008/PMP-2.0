'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../../services/api';
import { useAuth } from '../../../../features/auth/auth-context';
import { TeamMemberPaymentsView } from '../../../../features/finance';
import {
  ApiResponse,
  TeamMemberPaymentsResponse,
} from '../../../../types';

export default function TeamMemberPaymentsPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const canAccessFinance = isSuperAdmin || hasPermission('finance.read');

  const { data: teamPaymentsData, isLoading } = useQuery({
    queryKey: ['finance-team-members'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<TeamMemberPaymentsResponse>>(
        '/finance/team-members',
      );
      return res.data.data;
    },
    enabled: canAccessFinance,
  });

  if (!canAccessFinance) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
          403
        </div>
        <h3 className="text-base font-bold text-gray-900">Access Restricted</h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Team member payment reports are strictly restricted to Super Administrators.
        </p>
      </div>
    );
  }

  if (isLoading || !teamPaymentsData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return <TeamMemberPaymentsView data={teamPaymentsData} />;
}
