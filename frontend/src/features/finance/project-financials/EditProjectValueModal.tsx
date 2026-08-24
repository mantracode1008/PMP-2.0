'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DollarSign, AlertCircle, Calendar, Bell, FileText } from 'lucide-react';

interface EditProjectValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: number;
  currency: string;
  totalReceived: number;
  initialNextPaymentDueDate?: string | null;
  initialNextPaymentAmount?: number | null;
  initialPaymentReminderNotes?: string | null;
  onSave: (data: {
    projectValue: number;
    currency: string;
    nextPaymentDueDate?: string | null;
    nextPaymentAmount?: number | null;
    paymentReminderNotes?: string | null;
  }) => Promise<void>;
}

export function EditProjectValueModal({
  isOpen,
  onClose,
  currentValue,
  currency,
  totalReceived,
  initialNextPaymentDueDate,
  initialNextPaymentAmount,
  initialPaymentReminderNotes,
  onSave,
}: EditProjectValueModalProps) {
  const [projectValue, setProjectValue] = useState<number | string>(currentValue);
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'INR');
  const [nextPaymentDueDate, setNextPaymentDueDate] = useState<string>(
    initialNextPaymentDueDate ? initialNextPaymentDueDate.split('T')[0] : '',
  );
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number | string>(
    initialNextPaymentAmount || '',
  );
  const [paymentReminderNotes, setPaymentReminderNotes] = useState<string>(
    initialPaymentReminderNotes || '',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectValue(currentValue);
      setSelectedCurrency(currency || 'INR');
      setNextPaymentDueDate(
        initialNextPaymentDueDate ? initialNextPaymentDueDate.split('T')[0] : '',
      );
      setNextPaymentAmount(initialNextPaymentAmount || '');
      setPaymentReminderNotes(initialPaymentReminderNotes || '');
      setError(null);
    }
  }, [
    isOpen,
    currentValue,
    currency,
    initialNextPaymentDueDate,
    initialNextPaymentAmount,
    initialPaymentReminderNotes,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(projectValue);

    if (isNaN(val) || val < 0) {
      setError('Project value must be a valid non-negative number');
      return;
    }

    if (val < totalReceived) {
      setError(
        `Project value cannot be less than total client payments already received (${selectedCurrency} ${totalReceived.toLocaleString()})`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        projectValue: val,
        currency: selectedCurrency,
        nextPaymentDueDate: nextPaymentDueDate ? new Date(nextPaymentDueDate).toISOString() : null,
        nextPaymentAmount: nextPaymentAmount ? Number(nextPaymentAmount) : null,
        paymentReminderNotes: paymentReminderNotes ? paymentReminderNotes.trim() : null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to update project value');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Project Financials & Payment Schedule</h3>
              <p className="text-xs text-gray-500">Configure contract value and client payment reminder alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Financial Contract Value */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Total Project Value
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                  className="w-full text-sm font-semibold h-10"
                />
              </div>
            </div>

            {totalReceived > 0 && (
              <p className="text-xs text-gray-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                Minimum allowable value: <span className="font-bold text-gray-800">{selectedCurrency} {totalReceived.toLocaleString()}</span> (already received)
              </p>
            )}
          </div>

          {/* Section 2: Next Client Payment Reminder Alert Settings */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Client Payment Due Alert / Reminder
              </h4>
            </div>
            <p className="text-xs text-gray-500">
              Set the expected date of the next payment to trigger highlight notifications on the Super Admin dashboard when the date arrives or approaches.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Next Payment Due Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={nextPaymentDueDate}
                    onChange={(e) => setNextPaymentDueDate(e.target.value)}
                    className="w-full text-xs h-10 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expected Payment Amount ({selectedCurrency})
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={nextPaymentAmount}
                  onChange={(e) => setNextPaymentAmount(e.target.value)}
                  placeholder="Optional milestone amount"
                  className="w-full text-xs h-10 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Reminder Notes / Milestone
              </label>
              <Input
                type="text"
                value={paymentReminderNotes}
                onChange={(e) => setPaymentReminderNotes(e.target.value)}
                placeholder="e.g. 50% on milestone 2 completion, or invoice #102 due"
                className="w-full text-xs h-10 bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

