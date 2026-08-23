'use client';

import React from 'react';
import { RiskMatrixData, RiskProbability, RiskImpact } from '@/types';
import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface RiskMatrixProps {
  matrixData: RiskMatrixData;
  onCellClick?: (probability: RiskProbability, impact: RiskImpact) => void;
}

const PROBABILITIES: RiskProbability[] = ['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'];
const IMPACTS: RiskImpact[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ matrixData, onCellClick }) => {
  const getCellColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100';
      case 'HIGH':
        return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100';
      case 'LOW':
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            4×4 Risk Matrix (Probability × Impact)
          </h3>
          <p className="text-xs text-slate-500">Interactive heat map of active project risk exposure</p>
        </div>

        {/* Matrix Stats Summary */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            High Severity: {matrixData.summary.highRisks}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
            Open: {matrixData.summary.openRisks}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Mitigated: {matrixData.summary.mitigatedRisks}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* Top-Left Header Placeholder */}
        <div className="flex items-center justify-center p-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Prob \ Impact
        </div>

        {/* Column Headers (Impact) */}
        {IMPACTS.map((impact) => (
          <div
            key={impact}
            className="text-center py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-100 rounded-lg"
          >
            {impact.replace('_', ' ')}
          </div>
        ))}

        {/* Rows (Probabilities) */}
        {PROBABILITIES.map((prob) => (
          <React.Fragment key={prob}>
            {/* Row Label */}
            <div className="flex items-center justify-end pr-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 bg-slate-50 border border-slate-100 rounded-lg">
              {prob.replace('_', ' ')}
            </div>

            {/* Matrix Cells */}
            {IMPACTS.map((impact) => {
              const cell = matrixData.matrix?.[prob]?.[impact] || {
                score: 1,
                level: 'LOW',
                count: 0,
                risks: [],
              };
              const hasRisks = cell.count > 0;

              return (
                <button
                  type="button"
                  key={`${prob}-${impact}`}
                  onClick={() => onCellClick && onCellClick(prob, impact)}
                  className={`relative p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center group ${getCellColor(
                    cell.level,
                  )} ${hasRisks ? 'shadow-2xs font-semibold cursor-pointer ring-1 ring-slate-300' : 'opacity-70 cursor-default'}`}
                >
                  <span className="text-xl font-bold">{cell.count}</span>
                  <span className="text-[10px] uppercase font-mono tracking-tighter opacity-80">
                    Score: {cell.score}
                  </span>

                  {hasRisks && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current"></div>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
