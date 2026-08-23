'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { WeeklyTimesheetGrid, TimesheetStatus } from '../../types';
import { Button } from '../../components/ui/button';
import { LogTimeModal } from './log-time-modal';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Send,
  CheckCircle,
  AlertTriangle,
  Lock,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatMinutesToHours } from '../../lib/utils';

export function MyTimesheetsView() {
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [data, setData] = useState<WeeklyTimesheetGrid | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTimesheet = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const res = await api.get<{ data: WeeklyTimesheetGrid }>(`/timesheets/my?weekDate=${dateStr}`);
      setData(res.data.data);
    } catch (err: any) {
      console.error('Failed to load timesheet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheet(currentWeekDate);
  }, [currentWeekDate]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const handleToday = () => {
    setCurrentWeekDate(new Date());
  };

  const handleSubmitTimesheet = async () => {
    if (!data?.timesheet?.id) return;
    if (!confirm('Are you sure you want to submit your weekly timesheet for review? Once submitted, it will be sent to your project manager.')) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post(`/timesheets/${data.timesheet.id}/submit`);
      setFeedback({ type: 'success', message: 'Timesheet submitted successfully for manager approval.' });
      await fetchTimesheet(currentWeekDate);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'Failed to submit timesheet' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatWeekRange = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return '';
    const start = new Date(startStr);
    const end = new Date(endStr);
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, opt)} – ${end.toLocaleDateString(undefined, { ...opt, year: 'numeric' })}`;
  };

  const getStatusBadge = (status?: TimesheetStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" /> Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="h-3.5 w-3.5" /> Submitted (Pending Review)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="h-3.5 w-3.5" /> Changes Requested
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Lock className="h-3.5 w-3.5" /> Locked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="h-3.5 w-3.5" /> Draft (Unsubmitted)
          </span>
        );
    }
  };

  const isLockedOrApproved = data?.timesheet?.status === 'APPROVED' || data?.timesheet?.status === 'LOCKED';
  const canSubmit = data?.timesheet?.status === 'DRAFT' || data?.timesheet?.status === 'REJECTED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="h-5 w-5" />
            </div>
            My Weekly Timesheets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily task hours and submit weekly timesheets for approval
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Selector Controls */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              This Week
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isLockedOrApproved && (
            <Button
              onClick={() => setIsLogModalOpen(true)}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold h-9"
            >
              <Plus className="h-4 w-4" /> Log Time
            </Button>
          )}

          {canSubmit && (
            <Button
              onClick={handleSubmitTimesheet}
              disabled={submitting || (data?.timesheet?.weeklyTotalMinutes || 0) === 0}
              variant="outline"
              className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-semibold h-9"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Submitting...' : 'Submit Timesheet'}
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Week Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-indigo-600 shrink-0" />
          <div>
            <span className="text-sm font-bold text-slate-900">
              Week of {formatWeekRange(data?.timesheet?.startDate, data?.timesheet?.endDate)}
            </span>
            <span className="text-xs text-slate-500 block">
              Logged Time:{' '}
              <strong className="text-slate-900 font-semibold">
                {data?.timesheet?.weeklyTotalHours || 0}h ({data?.timesheet?.weeklyTotalMinutes || 0} mins)
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {getStatusBadge(data?.timesheet?.status)}
        </div>
      </div>

      {/* Rejection Feedback Alert */}
      {data?.timesheet?.status === 'REJECTED' && data.timesheet.rejectionReason && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Timesheet Revision Requested</h4>
            <p className="text-xs text-amber-800 mt-1">
              Feedback from {data.timesheet.reviewedBy?.firstName || 'Manager'}: &ldquo;
              {data.timesheet.rejectionReason}&rdquo;
            </p>
            <p className="text-xs text-amber-700 font-medium mt-2">
              Please adjust your work logs for this week and click &ldquo;Submit Timesheet&rdquo; when ready.
            </p>
          </div>
        </div>
      )}

      {/* Desktop Weekly Spreadsheet Table */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-72">Task / Project</th>
              <th className="py-3.5 px-3 text-center">Mon</th>
              <th className="py-3.5 px-3 text-center">Tue</th>
              <th className="py-3.5 px-3 text-center">Wed</th>
              <th className="py-3.5 px-3 text-center">Thu</th>
              <th className="py-3.5 px-3 text-center">Fri</th>
              <th className="py-3.5 px-3 text-center text-slate-400 bg-slate-100/50">Sat</th>
              <th className="py-3.5 px-3 text-center text-slate-400 bg-slate-100/50">Sun</th>
              <th className="py-3.5 px-4 text-right bg-indigo-50/40 text-indigo-900 font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-medium">
                  Loading timesheet data...
                </td>
              </tr>
            ) : data?.taskRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto text-slate-500">
                    <Clock className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No work logged this week</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4 text-center">
                      Log your daily task progress to track hours for this weekly timesheet.
                    </p>
                    {!isLockedOrApproved && (
                      <Button
                        onClick={() => setIsLogModalOpen(true)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Log First Entry
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data?.taskRows.map((row) => (
                <tr key={row.task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 text-xs truncate max-w-64" title={row.task.title}>
                      #{row.task.taskNumber} - {row.task.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono font-semibold text-indigo-600 bg-indigo-50 px-1 rounded">
                        {row.project.code}
                      </span>
                      <span className="truncate max-w-40">{row.project.name}</span>
                    </div>
                  </td>
                  {/* Days 1 to 7 (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0) */}
                  {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                    const dayData = row.days[dayIdx];
                    const isWeekend = dayIdx === 6 || dayIdx === 0;
                    return (
                      <td
                        key={dayIdx}
                        className={`py-3 px-2 text-center text-xs ${
                          isWeekend ? 'bg-slate-50/30' : ''
                        }`}
                      >
                        {dayData && dayData.durationMinutes > 0 ? (
                          <span className="inline-block px-2 py-1 rounded-md bg-indigo-50/70 text-indigo-800 font-semibold border border-indigo-100/80">
                            {Number((dayData.durationMinutes / 60).toFixed(1))}h
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right font-bold text-xs bg-indigo-50/20 text-indigo-900">
                    {row.totalHours}h
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {data && data.taskRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 text-xs font-bold text-slate-900">
                <td className="py-3 px-4 uppercase tracking-wider text-slate-600">Daily Totals</td>
                <td className="py-3 px-2 text-center text-slate-800 font-mono">{data.dailyTotals.monday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-800 font-mono">{data.dailyTotals.tuesday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-800 font-mono">{data.dailyTotals.wednesday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-800 font-mono">{data.dailyTotals.thursday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-800 font-mono">{data.dailyTotals.friday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-500 font-mono bg-slate-100/50">{data.dailyTotals.saturday.hours}h</td>
                <td className="py-3 px-2 text-center text-slate-500 font-mono bg-slate-100/50">{data.dailyTotals.sunday.hours}h</td>
                <td className="py-3 px-4 text-right font-extrabold text-sm text-indigo-700 bg-indigo-100/50">
                  {data.timesheet.weeklyTotalHours}h
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile Card Breakdown View */}
      <div className="lg:hidden space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Breakdown</h3>
        {[
          { label: 'Monday', data: data?.dailyTotals.monday, dayIdx: 1 },
          { label: 'Tuesday', data: data?.dailyTotals.tuesday, dayIdx: 2 },
          { label: 'Wednesday', data: data?.dailyTotals.wednesday, dayIdx: 3 },
          { label: 'Thursday', data: data?.dailyTotals.thursday, dayIdx: 4 },
          { label: 'Friday', data: data?.dailyTotals.friday, dayIdx: 5 },
          { label: 'Saturday', data: data?.dailyTotals.saturday, dayIdx: 6 },
          { label: 'Sunday', data: data?.dailyTotals.sunday, dayIdx: 0 },
        ].map((day) => {
          const logsForDay = data?.rawWorkLogs.filter((l) => new Date(l.date).getUTCDay() === day.dayIdx) || [];
          return (
            <div key={day.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">{day.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {day.data?.hours || 0}h
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {logsForDay.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No entries for this day</p>
                ) : (
                  logsForDay.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate max-w-[200px]">
                        <span className="font-medium text-slate-800">
                          #{l.task?.taskNumber} {l.task?.title}
                        </span>
                        {l.description && (
                          <p className="text-[11px] text-slate-500 truncate">{l.description}</p>
                        )}
                      </div>
                      <span className="font-semibold text-slate-700">
                        {Number((l.durationMinutes / 60).toFixed(1))}h
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LogTimeModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={() => fetchTimesheet(currentWeekDate)}
      />
    </div>
  );
}
