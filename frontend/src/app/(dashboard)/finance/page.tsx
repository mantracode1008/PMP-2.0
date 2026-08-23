'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { useAuth } from '../../../features/auth/auth-context';
import { FinanceDashboardView } from '../../../features/finance';
import {
  ApiResponse,
  FinanceDashboardResponse,
} from '../../../types';
import { useToast } from '../../../components/ui/toast';

export default function FinanceDashboardPage() {
  const { isSuperAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const canAccessFinance = isSuperAdmin || hasPermission('finance.read');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['finance-dashboard', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await api.get<ApiResponse<FinanceDashboardResponse>>(
        `/finance/dashboard?${params.toString()}`,
      );
      return res.data.data;
    },
    enabled: canAccessFinance,
  });

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/finance/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `finance-overview-${new Date().toISOString().split('T')[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Success', 'Financial overview report exported to CSV.', 'success');
    } catch (err: any) {
      showToast('Error', err?.response?.data?.message || 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!canAccessFinance) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
          403
        </div>
        <h3 className="text-base font-bold text-gray-900">Access Restricted</h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Project financial management and dashboard metrics are strictly restricted to Super Administrators.
        </p>
      </div>
    );
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <FinanceDashboardView
      data={dashboardData}
      search={search}
      onSearchChange={(val) => {
        setSearch(val);
        setPage(1);
      }}
      statusFilter={statusFilter}
      onStatusFilterChange={(val) => {
        setStatusFilter(val);
        setPage(1);
      }}
      page={page}
      onPageChange={setPage}
      onExportCsv={handleExportCsv}
      isExporting={isExporting}
    />
  );
}
