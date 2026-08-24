'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { PaymentReminderItem, PaymentRemindersResponse } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { formatDate } from '../../../lib/utils';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Sparkles,
  Filter,
} from 'lucide-react';

interface PaymentRemindersCardProps {
  initialData?: PaymentRemindersResponse;
  compact?: boolean;
}

export function PaymentRemindersCard({ compact = false }: PaymentRemindersCardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING'>('ALL');

  const { data: reminderResponse, isLoading } = useQuery({
    queryKey: ['payment-reminders', filter],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentRemindersResponse }>('/finance/payment-reminders', {
        params: { status: filter, daysAhead: 14 },
      });
      return res.data.data;
    },
    refetchInterval: 30000, // auto-refresh every 30 seconds for live alert
  });

  const summary = reminderResponse?.summary;
  const reminders = reminderResponse?.reminders ?? [];

  const formatMoney = (amount: number, currency: string = 'INR') => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getUrgencyBadge = (reminder: PaymentReminderItem) => {
    switch (reminder.urgencyStatus) {
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue by {Math.abs(reminder.daysRemaining)} {Math.abs(reminder.daysRemaining) === 1 ? 'day' : 'days'}
          </span>
        );
      case 'DUE_TODAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Due Today
          </span>
        );
      case 'UPCOMING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3.5 h-3.5" />
            Due in {reminder.daysRemaining} {reminder.daysRemaining === 1 ? 'day' : 'days'}
          </span>
        );
    }
  };

  if (isLoading && !reminderResponse) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasUrgentAlerts = (summary?.overdueCount || 0) > 0 || (summary?.dueTodayCount || 0) > 0;

  return (
    <Card className={`overflow-hidden border transition-all duration-200 ${
      hasUrgentAlerts ? 'border-amber-300/80 bg-linear-to-b from-amber-50/30 via-white to-white shadow-sm' : 'border-slate-200/80 bg-white'
    }`}>
      <CardHeader className="p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              hasUrgentAlerts ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Client Payment Due Alerts
                </CardTitle>
                {summary && summary.totalReminders > 0 && (
                  <span className="flex h-5 items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-bold text-white shadow-2xs">
                    {summary.totalReminders}
                  </span>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Upcoming and overdue client payment installments requiring collection
              </CardDescription>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({summary?.totalReminders || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilter('OVERDUE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filter === 'OVERDUE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Overdue ({summary?.overdueCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilter('DUE_TODAY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filter === 'DUE_TODAY'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Due Today ({summary?.dueTodayCount || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UPCOMING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                filter === 'UPCOMING'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Due Soon ({summary?.dueSoonCount || 0})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2">
        {reminders.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">All Client Payments On Track</p>
            <p className="text-xs text-slate-500 mt-0.5">
              No clients have payments overdue or due in the next 14 days.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, compact ? 4 : 10).map((r) => {
              const amountDue = r.nextPaymentAmount || r.pending;
              const isOverdue = r.urgencyStatus === 'OVERDUE';
              const isToday = r.urgencyStatus === 'DUE_TODAY';

              return (
                <div
                  key={r.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isOverdue
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300 hover:shadow-xs'
                      : isToday
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 hover:shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  {/* Left: Client & Project details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                        {r.projectCode}
                      </span>
                      <Link
                        href={`/projects/${r.projectId}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate"
                      >
                        {r.projectName}
                      </Link>
                      {getUrgencyBadge(r)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      {r.client && (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{r.client.companyName || r.client.name}</span>
                        </div>
                      )}
                      {r.client?.email && (
                        <a
                          href={`mailto:${r.client.email}`}
                          className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[160px]">{r.client.email}</span>
                        </a>
                      )}
                      {r.client?.phone && (
                        <a
                          href={`tel:${r.client.phone}`}
                          className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{r.client.phone}</span>
                        </a>
                      )}
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: <strong className="text-slate-800">{formatDate(r.nextPaymentDueDate)}</strong></span>
                      </div>
                    </div>

                    {r.paymentReminderNotes && (
                      <p className="text-[11px] text-slate-500 italic bg-white/80 px-2.5 py-1 rounded-md border border-slate-200/60 inline-block">
                        Note: {r.paymentReminderNotes}
                      </p>
                    )}
                  </div>

                  {/* Right: Payment Amount & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Expected Amount
                      </div>
                      <div className={`text-base font-extrabold ${
                        isOverdue ? 'text-rose-600' : isToday ? 'text-amber-700' : 'text-slate-900'
                      }`}>
                        {formatMoney(amountDue, r.currency)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Pending: {formatMoney(r.pending, r.currency)}
                      </div>
                    </div>

                    <Link href={`/projects/${r.projectId}`}>
                      <Button
                        size="sm"
                        className={`text-xs font-semibold h-8 gap-1 shadow-2xs ${
                          isOverdue
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : isToday
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <span>Finance</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {compact && reminders.length > 4 && (
              <div className="text-center pt-2">
                <Link
                  href="/finance"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                >
                  View all {reminders.length} client payment alerts in Finance Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
