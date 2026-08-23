'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../features/auth/auth-context';
import { cn, getInitials } from '../../lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Building2,
  Users2,
  UserCheck,
  Building,
  ShieldCheck,
  Settings,
  User,
  LogOut,
  FolderGit2,
  Clock,
  FileSpreadsheet,
  BarChart3,
  FolderKanban,
  FileCheck2,
  DollarSign,
  FileText,
  CreditCard,
  Flag,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
  section?: 'main' | 'admin' | 'finance' | 'settings';
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { label: 'My Work', href: '/my-work', icon: CheckSquare, section: 'main' },
  { label: 'My Timesheets', href: '/my-timesheets', icon: Clock, section: 'main' },
  { label: 'Projects', href: '/projects', icon: Briefcase, permission: 'projects.read', section: 'main' },
  { label: 'Templates', href: '/templates', icon: FolderKanban, permission: 'templates.read', section: 'main' },
  { label: 'Clients', href: '/clients', icon: Building2, permission: 'clients.read', section: 'main' },
  { label: 'Teams', href: '/teams', icon: Users2, permission: 'teams.read', section: 'main' },
  { label: 'Departments', href: '/departments', icon: Building, permission: 'departments.read', section: 'main' },

  // Admin Section
  { label: 'Team Workload', href: '/workload', icon: BarChart3, permission: 'workload.read', section: 'admin' },
  { label: 'Timesheets', href: '/timesheets', icon: FileSpreadsheet, permission: 'timesheets.approve', section: 'admin' },
  { label: 'Users', href: '/users', icon: UserCheck, permission: 'users.read', section: 'admin' },
  { label: 'Roles & Access', href: '/roles', icon: ShieldCheck, permission: 'roles.read', section: 'admin' },

  // Finance Section (Super Admin Only)
  { label: 'Finance Dashboard', href: '/finance', icon: DollarSign, permission: 'finance.read', section: 'finance' },
  { label: 'Team Member Payments', href: '/finance/team-members', icon: Users2, permission: 'finance.read', section: 'finance' },

  // Settings Section
  { label: 'Profile', href: '/profile', icon: User, section: 'settings' },
  { label: 'Settings', href: '/settings', icon: Settings, section: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, hasPermission, isSuperAdmin, logout } = useAuth();

  const isVisible = (item: NavItem) => {
    if (item.section === 'finance' && !isSuperAdmin && !hasPermission('finance.read')) return false;
    if (item.permission && !hasPermission(item.permission) && !isSuperAdmin) return false;
    return true;
  };

  const mainItems = NAV_ITEMS.filter((i) => i.section === 'main' && isVisible(i));
  const adminItems = NAV_ITEMS.filter((i) => i.section === 'admin' && isVisible(i));
  const financeItems = NAV_ITEMS.filter((i) => i.section === 'finance' && isVisible(i));
  const settingItems = NAV_ITEMS.filter((i) => i.section === 'settings' && isVisible(i));

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <FolderGit2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base">PMP Portal</span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-indigo-600">Enterprise</span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Workspace
            </p>
            <nav className="space-y-1">
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/my-work' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Navigation */}
          {adminItems.length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Administration
              </p>
              <nav className="space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Finance Navigation (Super Admin) */}
          {financeItems.length > 0 && (
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Finance & Revenue
              </p>
              <nav className="space-y-1">
                {financeItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/finance' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Settings Navigation */}
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Preferences
            </p>
            <nav className="space-y-1">
              {settingItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
              {getInitials(user?.firstName, user?.lastName, user?.email)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {isSuperAdmin ? 'Super Admin' : user?.roles?.[0]?.displayName || 'Member'}
              </p>
            </div>
          </Link>

          <button
            onClick={() => logout()}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 hover:shadow-2xs transition-all"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
