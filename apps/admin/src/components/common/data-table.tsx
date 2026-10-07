'use client';

import { useMemo, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { cn } from '@/lib/utils/cn';

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data?: T[];
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
};

/**
 * جدول داده‌های عمومی — ساخته‌شده روی `@tanstack/react-table`.
 *
 * ستون‌ها با نوع سادهٔ `Column<T>` تعریف می‌شوند و در داخل به
 * `ColumnDef` تبدیل می‌گردند. در حالت بارگذاری یک پیام ساده، و در صورت
 * خالی بودن داده‌ها یک `EmptyState` نمایش داده می‌شود.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  emptyTitle = 'داده‌ای یافت نشد',
  emptyDescription = 'وقتی داده‌ای اضافه شود اینجا نمایش داده می‌شود.',
  rowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const rows = data ?? [];

  const classByKey = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const col of columns) map[col.key] = col.className;
    return map;
  }, [columns]);

  const tableColumns = useMemo<ColumnDef<T, unknown>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        header: col.header,
        cell: ({ row }) => col.cell(row.original),
      })),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row, index) => (rowKey ? rowKey(row) : String(index)),
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
        در حال بارگذاری داده‌ها…
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className={cn('rounded-lg border', className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="bg-muted/40 hover:bg-muted/40"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={classByKey[header.column.id]}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={classByKey[cell.column.id]}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
