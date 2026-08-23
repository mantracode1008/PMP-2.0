'use client';

import React, { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/button';
import { X, Clock, Settings, Check } from 'lucide-react';
import { WorkloadUser } from '../../types';

interface CapacityModalProps {
  user: WorkloadUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CapacityModal({ user, isOpen, onClose, onSuccess }: CapacityModalProps) {
  const [dailyHours, setDailyHours] = useState(
    user?.capacity?.dailyCapacityHours ? String(user.capacity.dailyCapacityHours) : '8'
  );
  const [weeklyHours, setWeeklyHours] = useState(
    user?.capacity?.weeklyCapacityHours ? String(user.capacity.weeklyCapacityHours) : '40'
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    user?.capacity?.workingDays || [1, 2, 3, 4, 5]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const toggleDay = (dayIdx: number) => {
    if (workingDays.includes(dayIdx)) {
      if (workingDays.length === 1) return; // Keep at least one working day
      setWorkingDays(workingDays.filter((d) => d !== dayIdx));
    } else {
      setWorkingDays([...workingDays, dayIdx].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const dHours = parseFloat(dailyHours);
    const wHours = parseFloat(weeklyHours);

    if (isNaN(dHours) || dHours <= 0) {
      setError('Daily hours must be a positive number.');
      return;
    }

    if (isNaN(wHours) || wHours <= 0) {
      setError('Weekly hours must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/capacity/${user.user.id}`, {
        dailyCapacityMinutes: Math.round(dHours * 60),
        weeklyCapacityMinutes: Math.round(wHours * 60),
        workingDays,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user capacity');
    } finally {
      setLoading(false);
    }
  };

  const dayNames = [
    { idx: 1, label: 'Mon' },
    { idx: 2, label: 'Tue' },
    { idx: 3, label: 'Wed' },
    { idx: 4, label: 'Thu' },
    { idx: 5, label: 'Fri' },
    { idx: 6, label: 'Sat' },
    { idx: 7, label: 'Sun' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Configure Capacity</h3>
              <p className="text-xs text-slate-500">
                {user.user.firstName} {user.user.lastName} ({user.user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 font-medium border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Capacity (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={dailyHours}
                onChange={(e) => {
                  setDailyHours(e.target.value);
                  const d = parseFloat(e.target.value);
                  if (!isNaN(d)) {
                    setWeeklyHours(String(d * workingDays.length));
                  }
                }}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Weekly Capacity (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="168"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Working Days
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {dayNames.map((d) => {
                const isSelected = workingDays.includes(d.idx);
                return (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => toggleDay(d.idx)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Saving...' : 'Save Capacity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
