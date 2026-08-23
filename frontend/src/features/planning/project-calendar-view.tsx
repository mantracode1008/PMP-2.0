'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { CalendarEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
} from 'lucide-react';

interface ProjectCalendarViewProps {
  projectId: string;
  onSelectTask?: (taskId: string) => void;
}

export function ProjectCalendarView({ projectId, onSelectTask }: ProjectCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await api.get<{ data: { events: CalendarEvent[] } }>(
        `/projects/${projectId}/calendar?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );
      setEvents(res.data.data.events);
    } catch (err: any) {
      console.error('Failed to load project calendar events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday start (0=Mon ... 6=Sun)
  const mondayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const calendarCells = [];
  for (let i = 0; i < mondayOffset; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(new Date(year, month, day));
  }

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((e) => {
      const startStr = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : null;
      const dueStr = e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : null;
      return dateStr === dueStr || dateStr === startStr;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{monthName}</h3>
            <p className="text-xs text-slate-500">Deadlines, milestone target dates, and scheduled tasks</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Bar */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold uppercase tracking-wider text-slate-500 py-2">
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div className="text-slate-400">Sat</div>
        <div className="text-slate-400">Sun</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 text-xs min-h-[500px]">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="bg-slate-50/40 p-2 min-h-[100px]" />;
          }

          const dayEvents = getEventsForDay(cell);
          const cellIsToday = isToday(cell);

          return (
            <div
              key={cell.toISOString()}
              className={`p-2 min-h-[100px] flex flex-col justify-between transition-colors ${
                cellIsToday ? 'bg-indigo-50/20' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    cellIsToday
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700'
                  }`}
                >
                  {cell.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Event Pills */}
              <div className="mt-1.5 space-y-1 overflow-y-auto max-h-24">
                {dayEvents.map((evt) => {
                  if (evt.isMilestone) {
                    return (
                      <div
                        key={evt.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold truncate border border-indigo-200"
                        title={`Milestone: ${evt.title}`}
                      >
                        <Flag className="h-3 w-3 shrink-0 text-indigo-600" />
                        <span className="truncate">{evt.title}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={evt.id}
                      onClick={() => onSelectTask?.(evt.id)}
                      className="w-full text-left flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-medium truncate border border-blue-200 transition-colors"
                      title={evt.title}
                    >
                      <span className="truncate">{evt.title}</span>
                      <span className="text-[9px] font-bold text-blue-600 shrink-0">{evt.status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
