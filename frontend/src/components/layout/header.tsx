'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../features/auth/auth-context';
import { formatDate, getInitials } from '../../lib/utils';
import { PaymentRemindersResponse } from '../../types';
import {
  Bell,
  Search,
  Sparkles,
  Building,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowRight,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export function Header() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live payment reminders query for Super Admin / Admin
  const { data: reminderResponse } = useQuery({
    queryKey: ['header-payment-reminders'],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentRemindersResponse }>('/finance/payment-reminders', {
        params: { status: 'ALL', daysAhead: 14 },
      });
      return res.data.data;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const summary = reminderResponse?.summary;
  const reminders = reminderResponse?.reminders ?? [];
  const hasUrgent = (summary?.overdueCount || 0) > 0;
  const totalAlerts = summary?.totalReminders || 0;

  const formatMoney = (amount: number, currency: string = 'INR') => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Search Input */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Type to search projects, teams, clients... (⌘K)"
          className="w-full h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {user?.department && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs text-slate-700 font-medium border border-slate-200/60">
            <Building className="h-3.5 w-3.5 text-slate-500" />
            <span>{user.department.name}</span>
          </div>
        )}

        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Full System Access</span>
          </div>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative rounded-lg p-2 transition-colors ${
              isNotificationsOpen
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            title="Notifications & Payment Reminders"
          >
            <Bell className="h-4 w-4" />
            {totalAlerts > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-2xs ring-2 ring-white ${
                  hasUrgent ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
                }`}
              >
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/80 p-0 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Client Payment Alerts</h4>
                </div>
                {totalAlerts > 0 && (
                  <span className="text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full">
                    {totalAlerts} pending
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {reminders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1.5" />
                    <p className="font-semibold text-slate-800">No Pending Alerts</p>
                    <p className="text-slate-400 mt-0.5 text-[11px]">All client payments are currently up to date.</p>
                  </div>
                ) : (
                  reminders.slice(0, 5).map((r) => {
                    const isOverdue = r.urgencyStatus === 'OVERDUE';
                    const isToday = r.urgencyStatus === 'DUE_TODAY';
                    const amountDue = r.nextPaymentAmount || r.pending;

                    return (
                      <Link
                        key={r.id}
                        href={`/projects/${r.projectId}`}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {r.projectCode}
                              </span>
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600">
                                {r.projectName}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              Client: <span className="font-medium text-slate-700">{r.client?.companyName || r.client?.name || 'Unknown'}</span>
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                              <span>Due: {formatDate(r.nextPaymentDueDate)}</span>
                              <span>•</span>
                              <span className={`font-semibold ${
                                isOverdue ? 'text-rose-600' : isToday ? 'text-amber-700' : 'text-blue-600'
                              }`}>
                                {isOverdue
                                  ? `Overdue (${Math.abs(r.daysRemaining)}d)`
                                  : isToday
                                  ? 'Due Today'
                                  : `In ${r.daysRemaining}d`}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-extrabold block ${
                              isOverdue ? 'text-rose-600' : isToday ? 'text-amber-700' : 'text-slate-900'
                            }`}>
                              {formatMoney(amountDue, r.currency)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {isAdmin && (
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    href="/finance"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Open Finance Command Center <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Nav */}
        <Link href="/profile" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-2xs group-hover:bg-indigo-700 transition-colors">
            {getInitials(user?.firstName, user?.lastName, user?.email)}
          </div>
        </Link>
      </div>
    </header>
  );
}

