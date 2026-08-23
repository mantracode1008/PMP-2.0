'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Timesheet, TimesheetStatus } from '../../types';
import { Button } from '../../components/ui/button';
import { getInitials } from '../../lib/utils';
import {
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Lock,
  Clock,
  Send,
  AlertTriangle,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

export function AdminTimesheetsView() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [rejectingTimesheetId, setRejectingTimesheetId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [viewingTimesheet, setViewingTimesheet] = useState<Timesheet | null>(null);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : `&status=${statusFilter}`;
      const res = await api.get<{ data: Timesheet[] }>(`/timesheets?limit=100${statusParam}`);
      setTimesheets(res.data.data);
    } catch (err: any) {
      console.error('Failed to load timesheets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setFeedback(null);
    try {
      await api.post(`/timesheets/${id}/approve`);
      setFeedback({ type: 'success', message: 'Timesheet approved successfully.' });
      await fetchTimesheets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'Failed to approve timesheet' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTimesheetId || !rejectionReason.trim()) return;

    setProcessingId(rejectingTimesheetId);
    setFeedback(null);
    try {
      await api.post(`/timesheets/${rejectingTimesheetId}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      setFeedback({ type: 'success', message: 'Timesheet rejected with feedback sent to employee.' });
      setRejectingTimesheetId(null);
      setRejectionReason('');
      await fetchTimesheets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'Failed to reject timesheet' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleLock = async (id: string) => {
    setProcessingId(id);
    setFeedback(null);
    try {
      await api.post(`/timesheets/${id}/lock`);
      setFeedback({ type: 'success', message: 'Timesheet locked.' });
      await fetchTimesheets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.response?.data?.message || 'Failed to lock timesheet' });
    } finally {
      setProcessingId(null);
    }
  };

  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, opt)} – ${end.toLocaleDateString(undefined, { ...opt, year: 'numeric' })}`;
  };

  const getStatusBadge = (status: TimesheetStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Pending Review</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Changes Requested</span>;
      case 'LOCKED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Locked</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            Timesheet Approvals & Review
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, approve, or reject employee weekly time submissions
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'SUBMITTED', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All Submissions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Employee</th>
              <th className="py-3.5 px-4">Week Period</th>
              <th className="py-3.5 px-4 text-center">Work Logs</th>
              <th className="py-3.5 px-4 text-right">Total Hours</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                  Loading timesheet queue...
                </td>
              </tr>
            ) : timesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-xs mx-auto text-slate-500">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">Queue is clear</p>
                    <p className="text-xs text-slate-400 mt-1">No timesheets currently matching this filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold shrink-0">
                        {getInitials(ts.user?.firstName, ts.user?.lastName, ts.user?.email)}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-900">
                          {ts.user ? `${ts.user.firstName} ${ts.user.lastName}` : 'Unknown User'}
                        </p>
                        <p className="text-[11px] text-slate-400">{ts.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 font-medium">
                    {formatWeekRange(ts.startDate, ts.endDate)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-600">
                    {ts.workLogCount || 0} entries
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs font-extrabold text-indigo-900 font-mono">
                    {ts.totalHours || 0}h
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(ts.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ts.status === 'SUBMITTED' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(ts.id)}
                            disabled={processingId === ts.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8 px-2.5 gap-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectingTimesheetId(ts.id);
                              setRejectionReason('');
                            }}
                            disabled={processingId === ts.id}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs h-8 px-2.5 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}

                      {ts.status === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLock(ts.id)}
                          disabled={processingId === ts.id}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg text-xs h-8 px-2.5 gap-1"
                        >
                          <Lock className="h-3.5 w-3.5" /> Lock
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Feedback Modal */}
      {rejectingTimesheetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">Request Timesheet Revision</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide clear feedback explaining what changes the employee needs to make before resubmitting.
            </p>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Reason / Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Please add task descriptions for Thursday time logs and verify the 8h estimate on Project PRJ-001."
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectingTimesheetId(null)}
                  disabled={processingId === rejectingTimesheetId}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={processingId === rejectingTimesheetId || !rejectionReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white gap-1"
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
