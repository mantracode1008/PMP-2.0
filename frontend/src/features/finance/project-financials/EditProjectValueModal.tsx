'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { DollarSign, AlertCircle } from 'lucide-react';

interface EditProjectValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValue: number;
  currency: string;
  totalReceived: number;
  onSave: (data: { projectValue: number; currency: string }) => Promise<void>;
}

export function EditProjectValueModal({
  isOpen,
  onClose,
  currentValue,
  currency,
  totalReceived,
  onSave,
}: EditProjectValueModalProps) {
  const [projectValue, setProjectValue] = useState<number | string>(currentValue);
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'INR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjectValue(currentValue);
      setSelectedCurrency(currency || 'INR');
      setError(null);
    }
  }, [isOpen, currentValue, currency]);

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
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Set Project Financial Value</h3>
              <p className="text-xs text-gray-500">Configure total contract value and currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Project Financial Value
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              placeholder="e.g. 50000"
              required
              className="w-full text-base font-medium"
            />
            {totalReceived > 0 && (
              <p className="mt-1.5 text-xs text-gray-500">
                Minimum allowable value: <span className="font-semibold text-gray-700">{selectedCurrency} {totalReceived.toLocaleString()}</span> (already received)
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? 'Saving...' : 'Save Value'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
