'use client';

import React, { useState } from 'react';
import {
  ClientPayment,
  ExpenseCategory,
  ProjectExpense,
  ProjectFinancialResponse,
} from '../../../types';
import { Button } from '../../../components/ui/button';
import {
  DollarSign,
  CreditCard,
  Receipt,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  CheckCircle2,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { EditProjectValueModal } from './EditProjectValueModal';
import { AddEditClientPaymentModal } from './AddEditClientPaymentModal';
import { AddEditProjectExpenseModal } from './AddEditProjectExpenseModal';

interface ProjectFinancialsTabProps {
  financialData: ProjectFinancialResponse;
  teamMembers?: { id: string; name: string; email: string }[];
  onSetProjectValue: (data: { projectValue: number; currency: string }) => Promise<void>;
  onAddPayment: (data: any) => Promise<void>;
  onUpdatePayment: (paymentId: string, data: any) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onAddExpense: (data: any) => Promise<void>;
  onUpdateExpense: (expenseId: string, data: any) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  canManage: boolean;
}

type SubTab = 'overview' | 'payments' | 'expenses';

export function ProjectFinancialsTab({
  financialData,
  teamMembers = [],
  onSetProjectValue,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  canManage,
}: ProjectFinancialsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');

  // Modals state
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<ClientPayment | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ProjectExpense | null>(null);

  // Expense filters
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseMemberFilter, setExpenseMemberFilter] = useState<string>('ALL');

  const { metrics, clientPayments = [], projectExpenses = [] } = financialData;
  const currency = metrics.currency || 'INR';

  const formatMoney = (amount: number) => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const collectionRate =
    metrics.projectValue > 0
      ? Math.min(100, Math.round((metrics.totalReceived / metrics.projectValue) * 100))
      : 0;

  const profitMargin =
    metrics.projectValue > 0
      ? Math.round((metrics.expectedProfit / metrics.projectValue) * 100)
      : 0;

  // Filtered expenses
  const filteredExpenses = projectExpenses.filter((e) => {
    if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) return false;
    if (expenseMemberFilter !== 'ALL' && e.userId !== expenseMemberFilter) return false;
    return true;
  });

  const getCategoryBadgeColor = (category: ExpenseCategory) => {
    switch (category) {
      case 'DEVELOPER_PAYMENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DESIGNER_PAYMENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FREELANCER_PAYMENT':
      case 'TEAM_MEMBER_PAYMENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SOFTWARE_TOOLS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INFRASTRUCTURE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MARKETING':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatCategoryLabel = (category: ExpenseCategory) => {
    return category
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------- */}
      {/* 1. TOP FINANCIAL SUMMARY CARDS */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Project Value */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Project Value</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatMoney(metrics.projectValue)}</div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">Contract Total</span>
            {canManage && (
              <button
                onClick={() => setIsValueModalOpen(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Client Received */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Client Received</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600">{formatMoney(metrics.totalReceived)}</div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Collected</span>
            <span className="font-semibold text-emerald-700">{collectionRate}% of value</span>
          </div>
        </div>

        {/* Card 3: Pending Amount */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Amount</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-600">{formatMoney(metrics.remainingAmount)}</div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Receivable</span>
            <span className="font-medium text-gray-700">
              {metrics.remainingAmount === 0 && metrics.projectValue > 0 ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Fully Settled
                </span>
              ) : (
                'Remaining'
              )}
            </span>
          </div>
        </div>

        {/* Card 4: Project Expenses */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Project Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600">{formatMoney(metrics.totalExpenses)}</div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Team Payments</span>
            <span className="font-medium text-gray-700">{formatMoney(metrics.totalTeamMemberPayments)}</span>
          </div>
        </div>

        {/* Card 5: Current Cash Position */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Current Cash</span>
              <div
                className="group relative cursor-help"
                title="Current Cash Position = Total Client Received - Total Project Expenses (Available cash in hand)"
              >
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                metrics.currentCashPosition >= 0
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {metrics.currentCashPosition >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-xl font-bold ${
              metrics.currentCashPosition >= 0 ? 'text-indigo-600' : 'text-red-600'
            }`}
          >
            {formatMoney(metrics.currentCashPosition)}
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Received − Spent</span>
            <span className="font-medium text-gray-700">Cash Flow</span>
          </div>
        </div>

        {/* Card 6: Expected Project Profit */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-teal-200 transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Expected Profit</span>
              <div
                className="group relative cursor-help"
                title="Expected Project Profit = Project Value - Total Project Expenses (Net estimated profit upon full collection)"
              >
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl font-bold ${
              metrics.expectedProfit >= 0 ? 'text-teal-600' : 'text-red-600'
            }`}
          >
            {formatMoney(metrics.expectedProfit)}
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Value − Spent</span>
            <span className="font-semibold text-teal-700">{profitMargin}% Margin</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. SUB-NAVIGATION TABS */}
      {/* ----------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSubTab === 'overview'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('payments')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'payments'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Client Payments ({clientPayments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'expenses'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Project Expenses ({projectExpenses.length})
          </button>
        </div>

        {/* Action Buttons depending on sub-tab */}
        {canManage && (
          <div className="flex items-center gap-2">
            {activeSubTab === 'payments' && (
              <Button
                onClick={() => {
                  setPaymentToEdit(null);
                  setIsPaymentModalOpen(true);
                }}
                disabled={metrics.projectValue > 0 && metrics.remainingAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 flex items-center gap-1.5"
                title={
                  metrics.projectValue > 0 && metrics.remainingAmount <= 0
                    ? 'Project value is fully settled'
                    : 'Record new client payment'
                }
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </Button>
            )}

            {activeSubTab === 'expenses' && (
              <Button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            )}

            {activeSubTab === 'overview' && metrics.projectValue === 0 && (
              <Button
                onClick={() => setIsValueModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Set Project Value
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. SUB-TAB CONTENT */}
      {/* ----------------------------------------------------------- */}

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Empty State Banner if no value set */}
          {metrics.projectValue === 0 && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Set Project Financial Value</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Start tracking incoming client payments, pending amounts, project expenses, and real-time profitability.
                  </p>
                </div>
              </div>
              {canManage && (
                <Button
                  onClick={() => setIsValueModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Set Project Value
                </Button>
              )}
            </div>
          )}

          {/* Financial Flow Breakdown Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Project Cash Flow Breakdown
            </h3>

            {/* Progress Visualization */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Client Payment Collection</span>
                <span>
                  {formatMoney(metrics.totalReceived)} / {formatMoney(metrics.projectValue)} ({collectionRate}%)
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${collectionRate}%` }}
                  className="bg-emerald-500 transition-all duration-500 rounded-full"
                />
              </div>
            </div>

            {/* Step-by-Step Flow Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-4 border-t border-gray-100">
              <div className="p-3.5 bg-gray-50 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">1. Total Value</span>
                <span className="text-base font-bold text-gray-900 mt-1 block">{formatMoney(metrics.projectValue)}</span>
                <span className="text-[11px] text-gray-500">Agreed contract</span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">2. Received</span>
                <span className="text-base font-bold text-emerald-700 mt-1 block">{formatMoney(metrics.totalReceived)}</span>
                <span className="text-[11px] text-emerald-600">{clientPayments.length} payment entries</span>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">3. Pending Balance</span>
                <span className="text-base font-bold text-amber-700 mt-1 block">{formatMoney(metrics.remainingAmount)}</span>
                <span className="text-[11px] text-amber-600">Receivable</span>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-rose-600 block">4. Total Expenses</span>
                <span className="text-base font-bold text-rose-700 mt-1 block">{formatMoney(metrics.totalExpenses)}</span>
                <span className="text-[11px] text-rose-600">{projectExpenses.length} expense entries</span>
              </div>

              <div className="p-3.5 bg-teal-50/60 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-teal-600 block">5. Expected Profit</span>
                <span className="text-base font-bold text-teal-700 mt-1 block">{formatMoney(metrics.expectedProfit)}</span>
                <span className="text-[11px] text-teal-600">{profitMargin}% margin</span>
              </div>
            </div>
          </div>

          {/* Quick Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments Preview */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Recent Client Payments
                </h4>
                <button
                  onClick={() => setActiveSubTab('payments')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All ({clientPayments.length}) →
                </button>
              </div>

              {clientPayments.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No client payments recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {clientPayments.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100"
                    >
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{formatMoney(p.amount)}</div>
                        <div className="text-[11px] text-gray-500">
                          {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod}
                          {p.referenceNumber && ` • Ref: ${p.referenceNumber}`}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Received
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Expenses Preview */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  Recent Project Expenses
                </h4>
                <button
                  onClick={() => setActiveSubTab('expenses')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All ({projectExpenses.length}) →
                </button>
              </div>

              {projectExpenses.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No project expenses recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {projectExpenses.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100"
                    >
                      <div>
                        <div className="text-xs font-semibold text-gray-900">
                          {formatMoney(e.amount)} <span className="text-gray-500 font-normal">• {e.description}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {new Date(e.paymentDate).toLocaleDateString()}
                          {e.user && ` • Recipient: ${e.user.firstName} ${e.user.lastName}`}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                          e.category,
                        )}`}
                      >
                        {formatCategoryLabel(e.category)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CLIENT PAYMENTS */}
      {activeSubTab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Client Payments Received</h3>
              <p className="text-xs text-gray-500">
                Total Collected: <span className="font-semibold text-emerald-600">{formatMoney(metrics.totalReceived)}</span> | Remaining: <span className="font-semibold text-amber-600">{formatMoney(metrics.remainingAmount)}</span>
              </p>
            </div>
            {canManage && (
              <Button
                onClick={() => {
                  setPaymentToEdit(null);
                  setIsPaymentModalOpen(true);
                }}
                disabled={metrics.projectValue > 0 && metrics.remainingAmount <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Payment
              </Button>
            )}
          </div>

          {clientPayments.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">No client payments recorded yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Record payments received from the client to automatically update remaining receivables and cash balance.
              </p>
              {canManage && (
                <Button
                  onClick={() => {
                    setPaymentToEdit(null);
                    setIsPaymentModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Record First Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Reference No.</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Recorded By</th>
                    {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 text-sm">{formatMoney(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-700">{p.paymentMethod}</td>
                      <td className="px-4 py-3 text-gray-600">{p.referenceNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.notes || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.createdBy ? `${p.createdBy.firstName} ${p.createdBy.lastName}` : 'System'}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setPaymentToEdit(p);
                                setIsPaymentModalOpen(true);
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Payment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this payment of ${formatMoney(p.amount)}?`)) {
                                  onDeletePayment(p.id);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PROJECT EXPENSES */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Project Expenses & Team Payments</h3>
              <p className="text-xs text-gray-500">
                Total Expenses: <span className="font-semibold text-rose-600">{formatMoney(metrics.totalExpenses)}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="h-8 px-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="DEVELOPER_PAYMENT">Developer Payment</option>
                  <option value="DESIGNER_PAYMENT">Designer Payment</option>
                  <option value="FREELANCER_PAYMENT">Freelancer Payment</option>
                  <option value="TEAM_MEMBER_PAYMENT">Team Member Payment</option>
                  <option value="SOFTWARE_TOOLS">Software & Tools</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Team Member Filter */}
              {teamMembers.length > 0 && (
                <select
                  value={expenseMemberFilter}
                  onChange={(e) => setExpenseMemberFilter(e.target.value)}
                  className="h-8 px-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">All Team Members</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}

              {canManage && (
                <Button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </Button>
              )}
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">No project expenses found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Record developer payments, freelancer compensations, tooling licenses, or infrastructure expenses.
              </p>
              {canManage && (
                <Button
                  onClick={() => {
                    setExpenseToEdit(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Record First Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Recipient / Member</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Reference</th>
                    {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {new Date(e.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                            e.category,
                          )}`}
                        >
                          {formatCategoryLabel(e.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {e.user ? `${e.user.firstName} ${e.user.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600 text-sm">{formatMoney(e.amount)}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description}</td>
                      <td className="px-4 py-3 text-gray-600">{e.referenceNumber || '—'}</td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setExpenseToEdit(e);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete this expense of ${formatMoney(e.amount)}?`)) {
                                  onDeleteExpense(e.id);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 4. MODALS */}
      {/* ----------------------------------------------------------- */}
      {isValueModalOpen && (
        <EditProjectValueModal
          isOpen={isValueModalOpen}
          onClose={() => setIsValueModalOpen(false)}
          currentValue={metrics.projectValue}
          currency={currency}
          totalReceived={metrics.totalReceived}
          onSave={onSetProjectValue}
        />
      )}

      {isPaymentModalOpen && (
        <AddEditClientPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentToEdit(null);
          }}
          projectId={financialData.projectId}
          currency={currency}
          projectValue={metrics.projectValue}
          remainingAmount={metrics.remainingAmount}
          paymentToEdit={paymentToEdit}
          onSave={async (data) => {
            if (paymentToEdit) {
              await onUpdatePayment(paymentToEdit.id, data);
            } else {
              await onAddPayment(data);
            }
          }}
        />
      )}

      {isExpenseModalOpen && (
        <AddEditProjectExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
          currency={currency}
          expenseToEdit={expenseToEdit}
          teamMembers={teamMembers}
          onSave={async (data) => {
            if (expenseToEdit) {
              await onUpdateExpense(expenseToEdit.id, data);
            } else {
              await onAddExpense(data);
            }
          }}
        />
      )}
    </div>
  );
}
