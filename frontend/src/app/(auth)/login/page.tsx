'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../features/auth/auth-context';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { FolderGit2, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Sign in to PMP Portal
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Enterprise Project Management & Organization Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs font-medium text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2 h-10 font-semibold" isLoading={isLoading}>
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Quick Login (Demo Profiles)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@pmp.local', 'SuperAdmin123!')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Super Admin</span>
                <span className="text-[10px] text-slate-400">admin@pmp.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin.user@pmp.local', 'Admin123!')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Administrator</span>
                <span className="text-[10px] text-slate-400">admin.user@pmp.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('john.doe@pmp.local', 'User123!')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Developer (User)</span>
                <span className="text-[10px] text-slate-400">john.doe@pmp.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('elena.rostova@pmp.local', 'User123!')}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-all group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Designer (User)</span>
                <span className="text-[10px] text-slate-400">elena.rostova@pmp.local</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          PMP Portal v1.0 • Enterprise Monolith Architecture
        </p>
      </div>
    </div>
  );
}
