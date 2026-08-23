'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ExpenseCategory, PaymentMethod, ProjectExpense, User } from '../../../types';
import { Receipt, AlertCircle } from 'lucide-react';

interface AddEditProjectExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  expenseToEdit?: ProjectExpense | null;
  teamMembers: { id: string; name: string; email: string }[];
  onSave: (data: {
    category: ExpenseCategory;
    userId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string;
    description: string;
    receiptUrl?: string;
  }) => Promise<void>;
}

export function AddEditProjectExpenseModal({
  isOpen,
  onClose,
  currency,
  expenseToEdit,
  teamMembers,
  onSave,
}: AddEditProjectExpenseModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>('DEVELOPER_PAYMENT');
  const [userId, setUserId] = useState<string>('');
  const [amount, setAmount] = useState<number | string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setCategory(expenseToEdit.category);
        setUserId(expenseToEdit.userId || '');
        setAmount(expenseToEdit.amount);
        setPaymentDate(
          expenseToEdit.paymentDate
            ? new Date(expenseToEdit.paymentDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        );
        setPaymentMethod(expenseToEdit.paymentMethod || 'UPI');
        setReferenceNumber(expenseToEdit.referenceNumber || '');
        setDescription(expenseToEdit.description || '');
        setReceiptUrl(expenseToEdit.receiptUrl || '');
      } else {
        setCategory('DEVELOPER_PAYMENT');
        setUserId('');
        setAmount('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('UPI');
        setReferenceNumber('');
        setDescription('');
        setReceiptUrl('');
      }
      setError(null);
    }
  }, [isOpen, expenseToEdit]);

  if (!isOpen) return null;

  const isTeamMemberCategory = [
    'TEAM_MEMBER_PAYMENT',
    'DEVELOPER_PAYMENT',
    'DESIGNER_PAYMENT',
    'FREELANCER_PAYMENT',
  ].includes(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);

    if (isNaN(val) || val <= 0) {
      setError('Expense amount must be greater than zero');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description or purpose for the expense');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        category,
        userId: userId || undefined,
        amount: val,
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        description: description.trim(),
        receiptUrl: receiptUrl.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {expenseToEdit ? 'Edit Project Expense' : 'Record Project Expense'}
              </h3>
              <p className="text-xs text-gray-500">Record team payment, tooling, or project cost</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="DEVELOPER_PAYMENT">Developer Payment</option>
                <option value="DESIGNER_PAYMENT">Designer Payment</option>
                <option value="FREELANCER_PAYMENT">Freelancer Payment</option>
                <option value="TEAM_MEMBER_PAYMENT">Team Member Payment</option>
                <option value="SOFTWARE_TOOLS">Software & Tools</option>
                <option value="INFRASTRUCTURE">Infrastructure / Hosting</option>
                <option value="MARKETING">Marketing & Outreach</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Amount ({currency})
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                className="w-full text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Recipient / Team Member {isTeamMemberCategory ? '(Recommended)' : '(Optional)'}
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- Select Team Member (Optional) --</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Expense Date
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
                Payment Method (Optional)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Description / Notes *
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Frontend development sprint 1 delivery"
              required
              className="w-full text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Ref / Voucher No. (Optional)
              </label>
              <Input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TXN-88291"
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Receipt / Voucher URL (Optional)
              </label>
              <Input
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
