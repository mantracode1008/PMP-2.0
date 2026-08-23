'use client';

import React from 'react';
import { GlobalFinancialMetrics } from '../../../types';
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  Receipt,
  TrendingUp,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
} from 'lucide-react';

interface FinanceMetricsCardsProps {
  metrics: GlobalFinancialMetrics;
  currency?: string;
}

export function FinanceMetricsCards({
  metrics,
  currency = 'INR',
}: FinanceMetricsCardsProps) {
  const formatMoney = (amount: number) => {
    const symbol =
      currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
    return `${symbol}${amount.toLocaleString()}`;
  };

  const collectionRate =
    metrics.totalProjectValue > 0
      ? Math.min(100, Math.round((metrics.totalReceived / metrics.totalProjectValue) * 100))
      : 0;

  const profitMargin =
    metrics.totalProjectValue > 0
      ? Math.round((metrics.totalExpectedProfit / metrics.totalProjectValue) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* 1. Total Project Value */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Value</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{formatMoney(metrics.totalProjectValue)}</div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Active Projects</span>
          <span className="font-semibold text-gray-700">{metrics.totalProjects} Projects</span>
        </div>
      </div>

      {/* 2. Total Received */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-emerald-600">{formatMoney(metrics.totalReceived)}</div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Collection Rate</span>
          <span className="font-semibold text-emerald-700">{collectionRate}%</span>
        </div>
      </div>

      {/* 3. Total Pending Amount */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-amber-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Pending Amount</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-amber-600">{formatMoney(metrics.totalPending)}</div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Outstanding</span>
          <span className="font-medium text-gray-700">{100 - collectionRate}% remaining</span>
        </div>
      </div>

      {/* 4. Total Project Expenses */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-rose-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-rose-600">{formatMoney(metrics.totalExpenses)}</div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Total Outflow</span>
          <span className="font-medium text-rose-700">Team & Tools</span>
        </div>
      </div>

      {/* 5. Total Current Cash Position */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Current Cash</span>
            <div
              className="group relative cursor-help"
              title="Current Cash Position = Total Received - Total Expenses (Liquid cash available across all projects)"
            >
              <HelpCircle className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              metrics.totalCashPosition >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {metrics.totalCashPosition >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
          </div>
        </div>
        <div
          className={`text-xl font-bold ${
            metrics.totalCashPosition >= 0 ? 'text-indigo-600' : 'text-red-600'
          }`}
        >
          {formatMoney(metrics.totalCashPosition)}
        </div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Net Liquid Cash</span>
          <span className="font-medium text-indigo-700">In Hand</span>
        </div>
      </div>

      {/* 6. Total Expected Profit */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-teal-200 transition-all">
        <div className="flex items-center justify-between text-gray-500 mb-1.5">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expected Profit</span>
            <div
              className="group relative cursor-help"
              title="Expected Project Profit = Total Project Value - Total Expenses (Total projected profit upon full client settlement)"
            >
              <HelpCircle className="w-3 h-3 text-gray-400" />
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl font-bold ${
            metrics.totalExpectedProfit >= 0 ? 'text-teal-600' : 'text-red-600'
          }`}
        >
          {formatMoney(metrics.totalExpectedProfit)}
        </div>
        <div className="mt-2 text-[11px] text-gray-500 flex items-center justify-between">
          <span>Projected Margin</span>
          <span className="font-semibold text-teal-700">{profitMargin}%</span>
        </div>
      </div>
    </div>
  );
}
