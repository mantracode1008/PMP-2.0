'use client';

import React from 'react';
import { TaskStatus } from '../../types';
import { cn } from '../../lib/utils';
import {
  Circle,
  Clock,
  PlayCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Inbox,
} from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  BACKLOG: {
    label: 'Backlog',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Inbox,
  },
  TODO: {
    label: 'To Do',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
    icon: Circle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: PlayCircle,
  },
  IN_REVIEW: {
    label: 'In Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Eye,
  },
  QA: {
    label: 'QA / Testing',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Clock,
  },
  BLOCKED: {
    label: 'Blocked',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: AlertCircle,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    icon: XCircle,
  },
};

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const config = statusConfig[status] || statusConfig.TODO;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        config.bg,
        config.text,
        config.border,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
