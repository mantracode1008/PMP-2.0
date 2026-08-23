'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../features/auth/auth-context';
import { getInitials } from '../../lib/utils';
import { Bell, Search, Sparkles, Building } from 'lucide-react';

export function Header() {
  const { user, isSuperAdmin } = useAuth();

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

        {/* Notifications Placeholder */}
        <button
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        </button>

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
