'use client';

import React from 'react';
import { TaskPriority } from '../../types';
import { cn } from '../../lib/utils';
import { ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from 'lucide-react';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: ArrowDown,
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: ArrowRight,
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: ArrowUp,
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertTriangle,
  },
};

export const TaskPriorityBadge: React.FC<TaskPriorityBadgeProps> = ({
  priority,
  className,
  showIcon = true,
}) => {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {showIcon && <Icon className="h-2.5 w-2.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
