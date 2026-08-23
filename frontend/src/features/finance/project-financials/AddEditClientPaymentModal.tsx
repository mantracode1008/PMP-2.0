'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ClientPayment, PaymentMethod } from '../../../types';
import { CreditCard, AlertCircle, Sparkles } from 'lucide-react';

interface AddEditClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currency: string;
  projectValue: number;
  remainingAmount: number;
  paymentToEdit?: ClientPayment | null;
  onSave: (data: {
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
}

export function AddEditClientPaymentModal({
  isOpen,
  onClose,
  currency,
  projectValue,
  remainingAmount,
  paymentToEdit,
  onSave,
}: AddEditClientPaymentModalProps) {
  const [amount, setAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Maximum allowed for editing vs adding
  const maxAllowed = paymentToEdit
    ? remainingAmount + paymentToEdit.amount
    : remainingAmount;

  useEffect(() => {
    if (isOpen) {
      if (paymentToEdit) {
        setAmount(paymentToEdit.amount);
        setPaymentDate(
          paymentToEdit.paymentDate
            ? new Date(paymentToEdit.paymentDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        );
        setPaymentMethod(paymentToEdit.paymentMethod || 'UPI');
        setReferenceNumber(paymentToEdit.referenceNumber || '');
        setNotes(paymentToEdit.notes || '');
      } else {
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI');
        setReferenceNumber('');
        setNotes('');
      }
      setError(null);
    }
  }, [isOpen, paymentToEdit]);

  if (!isOpen) return null;

  const handleFillMax = () => {
    setAmount(maxAllowed);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);

    if (isNaN(val) || val <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    if (val > maxAllowed) {
      setError(
        `Payment amount (${currency} ${val.toLocaleString()}) exceeds the remaining allowed balance (${currency} ${maxAllowed.toLocaleString()})`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        amount: val,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {paymentToEdit ? 'Edit Client Payment' : 'Record Client Payment'}
              </h3>
              <p className="text-xs text-gray-500">Record incoming client payment for this project</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Payment Amount ({currency})
              </label>
              {maxAllowed > 0 && (
                <button
                  type="button"
                  onClick={handleFillMax}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Fill Remaining ({currency} {maxAllowed.toLocaleString()})
                </button>
              )}
            </div>
            <Input
              type="number"
              min="1"
              max={maxAllowed}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              required
              className="w-full text-base font-semibold"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>Project Value: {currency} {projectValue.toLocaleString()}</span>
              <span>Remaining Receivable: {currency} {remainingAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Payment Date
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Reference / Transaction No. (Optional)
            </label>
            <Input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. UPI/2026/0823-9912 or Cheque #88120"
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Notes / Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Advance payment received for Milestone 1"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isSubmitting ? 'Saving...' : paymentToEdit ? 'Update Payment' : 'Save Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
