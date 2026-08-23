'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { EmptyState } from './empty-state';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { PaginatedMeta } from '../../types';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  meta?: PaginatedMeta;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  filterComponent?: React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  meta,
  isLoading,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  filterComponent,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      {(onSearchChange || filterComponent) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          )}
          {filterComponent && <div className="flex items-center gap-2">{filterComponent}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <TableCell key={cIdx}>
                      <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <div className="py-8">
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      actionLabel={emptyActionLabel}
                      onAction={onEmptyAction}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx} className={col.className}>
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <p>
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => onPageChange?.(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-slate-700">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => onPageChange?.(meta.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
