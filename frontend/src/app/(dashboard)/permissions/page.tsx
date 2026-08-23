'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Key, Shield } from 'lucide-react';
import { ApiResponse, Permission } from '../../../types';

export default function PermissionsCataloguePage() {
  const { data: permissionsGrouped, isLoading } = useQuery({
    queryKey: ['permissions-catalogue'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Record<string, Permission[]>>>('/permissions/grouped');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Permissions Registry"
        description="Granular resource-action authorization tokens used across NestJS guards and API endpoints."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Roles & Access', href: '/roles' },
          { label: 'Permissions' },
        ]}
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {permissionsGrouped &&
            Object.entries(permissionsGrouped).map(([moduleName, perms]) => (
              <Card key={moduleName}>
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/50 border-b border-slate-100 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                      <Shield className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 capitalize">
                      {moduleName} Module
                    </CardTitle>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{perms.length} actions</span>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 transition-colors shadow-2xs"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <Key className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-slate-900">{p.code}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                          <span className="inline-block mt-2 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Action: {p.action}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
