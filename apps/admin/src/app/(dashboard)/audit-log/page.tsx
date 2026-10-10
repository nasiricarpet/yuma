'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Eye, X } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { AuditDetailDialog } from '@/components/audit/audit-detail-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PersianDatePicker } from '@/components/common/persian-date-picker';
import { useAuditLog, useAuditStats } from '@/lib/api/queries/use-audit';
import { useStaff } from '@/lib/api/queries/use-staff';
import { listAudit } from '@/lib/api/endpoints/audit';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_TONE,
  AUDIT_ACTIONS,
  type AuditAction,
  type AuditListParams,
  type AuditLogEntry,
} from '@/types';
import { formatJalaliDateTime, toFa } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/lib/utils/errors';

/** تعداد رویداد در هر صفحه */
const PAGE_SIZE = 20;
/** حداکثر صفحه‌ای که در خروجی CSV خوانده می‌شود — جلوگیری از درخواست بی‌پایان */
const MAX_EXPORT_PAGES = 50;

type ActionFilter = AuditAction | 'all';

/**
 * رویدادهای ممیزی پنل — `GET /admin/audit-log`
 *
 * @see apps/api/src/modules/audit-log/audit.controller.ts
 */
export default function AuditLogPage() {
  const [action, setAction] = useState<ActionFilter>('all');
  const [entityType, setEntityType] = useState('');
  const [actorId, setActorId] = useState('all');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: staff } = useStaff();

  // نام بازیگران — بک‌اند actor را join نمی‌کند، پس از لیست پرسنل می‌خوانیم
  const actorNames = useMemo(() => {
    const map = new Map<string, string>();
    (staff ?? []).forEach((member) => {
      map.set(member.id, member.fullName || member.mobile);
    });
    return map;
  }, [staff]);

  const params = useMemo<AuditListParams>(() => {
    const query: AuditListParams = { page, limit: PAGE_SIZE };
    if (action !== 'all') query.action = action;
    if (entityType.trim()) query.entityType = entityType.trim();
    if (actorId !== 'all') query.actorId = actorId;
    if (from) query.from = startOfDay(from);
    if (to) query.to = endOfDay(to);
    return query;
  }, [action, entityType, actorId, from, to, page]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useAuditLog(params);

  const { data: stats } = useAuditStats(params);

  const hasFilter =
    action !== 'all' ||
    entityType.trim() !== '' ||
    actorId !== 'all' ||
    from !== null ||
    to !== null;

  // با تغییر هر فیلتر به صفحهٔ اول برمی‌گردیم
  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setAction('all');
    setEntityType('');
    setActorId('all');
    setFrom(null);
    setTo(null);
    setPage(1);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const rows: AuditLogEntry[] = [];
      let total = Number.POSITIVE_INFINITY;
      let exportPage = 1;
      let truncated = false;

      while (rows.length < total && exportPage <= MAX_EXPORT_PAGES) {
        const res = await listAudit({ ...params, page: exportPage });
        rows.push(...res.data);
        total = res.total;
        if (res.data.length === 0) break;
        exportPage += 1;
      }

      if (rows.length < total) truncated = true;

      downloadCsv(rows, actorNames);

      if (truncated) {
        toast.warning(
          `فقط ${toFa(rows.length)} رویداد اول در CSV قرار گرفت — فیلترها را محدودتر کنید.`,
        );
      } else {
        toast.success(`${toFa(rows.length)} رویداد به CSV تبدیل شد`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'زمان',
      cell: (row) => (
        <span className="tabular-nums">{formatJalaliDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'actorId',
      header: 'actor',
      cell: (row) => (
        <ActorCell entry={row} actorNames={actorNames} />
      ),
    },
    {
      key: 'action',
      header: 'action',
      cell: (row) => (
        <StatusBadge
          label={AUDIT_ACTION_LABELS[row.action] ?? row.action}
          tone={AUDIT_ACTION_TONE[row.action]}
        />
      ),
    },
    {
      key: 'entityType',
      header: 'entity',
      cell: (row) => <EntityCell entry={row} />,
    },
    {
      key: 'ip',
      header: 'IP',
      cell: (row) =>
        row.ip ? (
          <span dir="ltr" className="tabular-nums text-muted-foreground">
            {row.ip}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-left',
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelected(row)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">مشاهدهٔ جزئیات</span>
        </Button>
      ),
    },
  ];

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const showPagination = totalPages > 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="لاگ ممیزی"
        description="تاریخچهٔ تغییرات و رویدادهای سامانه"
        actions={
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? 'در حال ساخت CSV…' : 'خروجی CSV'}
          </Button>
        }
      />

      {stats ? <StatsStrip stats={stats} /> : null}

      <div className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:flex-wrap">
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value as ActionFilter);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="فیلتر عمل">
            <SelectValue placeholder="همه عمل‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه عمل‌ها</SelectItem>
            {AUDIT_ACTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {AUDIT_ACTION_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={entityType}
          onChange={(event) => {
            setEntityType(event.target.value);
            resetPage();
          }}
          placeholder="نوع موجودیت (مثلاً user)"
          className="w-full lg:w-48"
          aria-label="فیلتر نوع موجودیت"
        />

        <Select
          value={actorId}
          onValueChange={(value) => {
            setActorId(value);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full lg:w-48" aria-label="فیلتر بازیگر">
            <SelectValue placeholder="همه بازیگران" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه بازیگران</SelectItem>
            {(staff ?? []).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.fullName || member.mobile}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <PersianDatePicker
            value={from}
            onChange={(date) => {
              setFrom(date);
              resetPage();
            }}
            placeholder="از تاریخ"
            aria-label="از تاریخ"
          />
          <PersianDatePicker
            value={to}
            onChange={(date) => {
              setTo(date);
              resetPage();
            }}
            placeholder="تا تاریخ"
            aria-label="تا تاریخ"
          />
        </div>

        {hasFilter ? (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {toFa(data?.total ?? 0)} رویداد ثبت شده
      </p>

      <DataTable<AuditLogEntry>
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(entry) => entry.id}
        emptyTitle="رویدادی یافت نشد"
        emptyDescription="هیچ رویداد ممیزی‌ای با این فیلترها پیدا نشد."
      />

      {showPagination ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              />
            </PaginationItem>

            {pageRange(page, totalPages).map((pageNumber, index) =>
              pageNumber === null ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                    …
                  </span>
                </PaginationItem>
              ) : (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={pageNumber === page}
                    onClick={() => setPage(pageNumber)}
                  >
                    {toFa(pageNumber)}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <AuditDetailDialog
        entry={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        actorNames={actorNames}
      />
    </div>
  );
}

/** ساعت شروع روز میلادی — ۰۰:۰۰:۰۰ UTC */
function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** ساعت پایان روز میلادی — ۲۳:۵۹:۵۹.۹۹۹ UTC */
function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

type ActorCellProps = {
  entry: AuditLogEntry;
  actorNames: Map<string, string>;
};

/**
 * نمایش بازیگر رویداد — نام پرسنل اگر شناخته شده، وگرنه شناسه خام.
 * رویدادهای سیستمی (actorId خالی) «سیستم» نشان داده می‌شوند.
 */
function ActorCell({ entry, actorNames }: ActorCellProps) {
  if (!entry.actorId) {
    return <span className="text-muted-foreground">سیستم</span>;
  }

  const name = actorNames.get(entry.actorId);

  return (
    <div className="flex flex-col">
      <span className="font-medium">{name ?? 'کاربر حذف‌شده'}</span>
      <span dir="ltr" className="text-xs text-muted-foreground">
        {entry.actorId.slice(-8)}
      </span>
    </div>
  );
}

/** نمایش موجودیت هدف — نوع و شناسه کوتاه‌شده */
function EntityCell({ entry }: { entry: AuditLogEntry }) {
  return (
    <div className="flex flex-col">
      <span>{entry.entityType}</span>
      {entry.entityId ? (
        <span dir="ltr" className="text-xs text-muted-foreground">
          #{entry.entityId.slice(-8)}
        </span>
      ) : null}
    </div>
  );
}

type StatsStripProps = {
  stats: {
    total: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
  };
};

/** نوار آمار کوتاه — کل رویدادها و تفکیک بر اساس عمل */
function StatsStrip({ stats }: StatsStripProps) {
  const entries = Object.entries(stats.byAction).sort((a, b) => b[1] - a[1]);

  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
      <span className="font-medium">مجموع: {toFa(stats.total)}</span>
      <span className="text-muted-foreground">|</span>
      {entries.map(([name, count]) => (
        <span key={name} className="text-muted-foreground">
          {AUDIT_ACTION_LABELS[name as AuditAction] ?? name}:{' '}
          <span className="font-medium text-foreground">{toFa(count)}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * بازهٔ شماره صفحات برای render پیجینیتور —
 * صفحهٔ اول و آخر همیشه هستند و در وسط پنجره‌ای دور صفحهٔ فعلی نشان داده می‌شود.
 */
function pageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | null)[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) result.push(null);
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) result.push(null);

  result.push(total);
  return result;
}

/** ساخت فایل CSV از رویدادها و دانلود آن */
function downloadCsv(
  rows: AuditLogEntry[],
  actorNames: Map<string, string>,
): void {
  const escape = (value: unknown): string => {
    const text = String(value ?? '');
    return /[",\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  };

  const header = [
    'زمان',
    'بازیگر',
    'نقش',
    'عمل',
    'نوع موجودیت',
    'شناسه موجودیت',
    'IP',
    'User-Agent',
    'شناسه درخواست',
  ];

  const lines = [header.map(escape).join(',')];

  for (const row of rows) {
    lines.push(
      [
        formatJalaliDateTime(row.createdAt),
        row.actorId ? (actorNames.get(row.actorId) ?? row.actorId) : 'سیستم',
        row.actorRole ?? '',
        AUDIT_ACTION_LABELS[row.action] ?? row.action,
        row.entityType,
        row.entityId ?? '',
        row.ip ?? '',
        row.userAgent ?? '',
        row.requestId ?? '',
      ]
        .map(escape)
        .join(','),
    );
  }

  // BOM برای اینکه Excel فایل UTF-8 را با حروف فارسی درست باز کند
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
