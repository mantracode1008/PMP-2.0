'use client';

import React from 'react';
import { BaselineComparisonData } from '@/types';
import { X, GitCompare, Calendar, Clock, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface BaselineCompareModalProps {
  comparisonData: BaselineComparisonData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BaselineCompareModal: React.FC<BaselineCompareModalProps> = ({
  comparisonData,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !comparisonData) return null;

  const { baseline, current, variance } = comparisonData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Baseline Variance Analysis</h3>
              <p className="text-xs text-slate-500">
                Baseline #{baseline.number}: {baseline.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Variance Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border ${
                variance.scheduleVarianceDays > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">Schedule Variance</span>
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">
                {variance.scheduleVarianceDays > 0
                  ? `+${variance.scheduleVarianceDays} Days Delayed`
                  : variance.scheduleVarianceDays === 0
                  ? 'On Schedule (0d)'
                  : `${variance.scheduleVarianceDays} Days Ahead`}
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                variance.effortVarianceHours > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">Effort Variance</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black mt-2 font-mono">
                {variance.effortVarianceHours > 0
                  ? `+${variance.effortVarianceHours}h Expanded`
                  : `${variance.effortVarianceHours}h Scope`}
              </div>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Metric</th>
                  <th className="py-3 px-4">Frozen Baseline</th>
                  <th className="py-3 px-4">Current Live Data</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">Target Completion Date</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {baseline.plannedEndDate
                      ? new Date(baseline.plannedEndDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-mono font-medium">
                    {current.targetDate ? new Date(current.targetDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono">
                    {variance.scheduleVarianceDays > 0 ? `+${variance.scheduleVarianceDays}d` : `${variance.scheduleVarianceDays}d`}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">Total Estimated Effort</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{baseline.estimatedHours} hrs</td>
                  <td className="py-3 px-4 text-slate-900 font-mono font-medium">{current.estimatedHours} hrs</td>
                  <td className="py-3 px-4 text-right font-bold font-mono">
                    {variance.effortVarianceHours > 0 ? `+${variance.effortVarianceHours}h` : `${variance.effortVarianceHours}h`}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">Total Tasks</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{baseline.totalTasks}</td>
                  <td className="py-3 px-4 text-slate-900 font-mono font-medium">{current.totalTasks}</td>
                  <td className="py-3 px-4 text-right font-bold font-mono">
                    {variance.taskCountVariance > 0 ? `+${variance.taskCountVariance}` : variance.taskCountVariance}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-700">Total Milestones</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{baseline.totalMilestones}</td>
                  <td className="py-3 px-4 text-slate-900 font-mono font-medium">{current.totalMilestones}</td>
                  <td className="py-3 px-4 text-right font-bold font-mono">
                    {variance.milestoneCountVariance > 0 ? `+${variance.milestoneCountVariance}` : variance.milestoneCountVariance}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
