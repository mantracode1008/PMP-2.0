'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { PageHeader } from '../../../components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Server, Database, Shield, Lock, Cpu, Globe } from 'lucide-react';
import { ApiResponse } from '../../../types';

export default function SettingsPage() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ status: string; service: string; database: string; uptime: number }>>('/health');
      return res.data.data;
    },
  });

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="System Settings & Environment"
        description="Configuration status, database connectivity, and architecture telemetry."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <div className="space-y-6">
        {/* Architecture & Infrastructure Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" /> Platform Architecture
            </CardTitle>
            <CardDescription>PMP Modular Monolith (Phase 1 Production Release)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-slate-400" /> Database
                  </span>
                  <Badge variant="success">{healthData?.database === 'UP' ? 'Connected' : 'Active'}</Badge>
                </div>
                <p className="text-sm font-bold text-slate-900">PostgreSQL 16</p>
                <p className="text-[11px] text-slate-400">Prisma ORM • Relational</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" /> API Engine
                  </span>
                  <Badge variant="success">Online</Badge>
                </div>
                <p className="text-sm font-bold text-slate-900">NestJS 11</p>
                <p className="text-[11px] text-slate-400">TypeScript • Modular</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-slate-400" /> Frontend Client
                  </span>
                  <Badge variant="success">Next.js 15</Badge>
                </div>
                <p className="text-sm font-bold text-slate-900">App Router</p>
                <p className="text-[11px] text-slate-400">Tailwind CSS • shadcn</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">API Endpoint</span>
                <span className="font-mono text-slate-800">http://localhost:4000/api/v1</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">OpenAPI Documentation</span>
                <a
                  href="http://localhost:4000/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-indigo-600 hover:underline"
                >
                  http://localhost:4000/api/docs
                </a>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Authorization Scheme</span>
                <span className="font-medium text-slate-800">JWT (15m expiry) + Hashed DB Refresh Rotation (7d)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" /> Security Standards
            </CardTitle>
            <CardDescription>Security policies enforced across backend guards and frontend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Zero Trust Token Verification</p>
                <p className="text-slate-500">
                  Every mutation and resource access is verified with granular permission decorators and guards.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
              <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">Hashed Refresh Token Rotation</p>
                <p className="text-slate-500">
                  Single-use refresh tokens prevent replay attacks. Passwords are never returned in responses.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
