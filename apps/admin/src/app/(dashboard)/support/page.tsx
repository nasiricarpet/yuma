'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
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
import { useSupportTickets } from '@/lib/api/queries/use-support';
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type SupportTicketCategory,
  type SupportTicketListParams,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from '@/types';
import { formatJalaliDateTime, toFa } from '@/lib/utils/format';

/** تعداد تیکت در هر صفحه */
const PAGE_SIZE = 20;

/** تن رنگی اولویت — فوری قرمز، زیاد نارنجی، متوسط آبی، کم خاکستری */
const PRIORITY_TONE: Record<
  SupportTicketPriority,
  'neutral' | 'info' | 'warning' | 'danger'
> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

/** تن رنگی وضعیت */
const STATUS_TONE: Record<
  SupportTicketStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  open: 'warning',
  pending_agent: 'info',
  resolved: 'success',
  closed: 'neutral',
};

type StatusFilter = SupportTicketStatus | 'all';
type PriorityFilter = SupportTicketPriority | 'all';

/**
 * بازه‌ی صفحات برای نمایش — با ellipsis.
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

/**
 * آیا مهلت پاسخ اولاده گذشته و هنوز پاسخی نرسیده؟ —
 * برای نمایش بج قرمز «نقض SLA».
 */
function isSlaBreached(ticket: SupportTicket): boolean {
  if (ticket.firstResponseAt) return false;
  if (!ticket.slaDueAt) return false;
  if (ticket.status === 'resolved' || ticket.status === 'closed') return false;

  return new Date(ticket.slaDueAt).getTime() < Date.now();
}

const COLUMNS: Column<SupportTicket>[] = [
  {
    key: 'subject',
    header: 'موضوع',
    cell: (ticket) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium">{ticket.subject}</span>
        <span className="text-xs text-muted-foreground">
          {TICKET_CATEGORY_LABELS[ticket.category] ?? ticket.category}
        </span>
      </div>
    ),
  },
  {
    key: 'customer',
    header: 'مشتری',
    cell: (ticket) =>
      ticket.customer ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{ticket.customer.fullName}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {ticket.customer.mobile}
          </span>
        </div>
      ) : (
        '—'
      ),
  },
  {
    key: 'priority',
    header: 'اولویت',
    cell: (ticket) => (
      <StatusBadge
        label={TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        tone={PRIORITY_TONE[ticket.priority]}
        dot={false}
      />
    ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    cell: (ticket) => (
      <div className="flex items-center gap-1.5">
        <StatusBadge
          label={TICKET_STATUS_LABELS[ticket.status] ?? ticket.status}
          tone={STATUS_TONE[ticket.status]}
          dot={false}
        />
        {isSlaBreached(ticket) ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-700/20 dark:bg-red-950 dark:text-red-300"
            title="مهلت پاسخ اولیه گذشته است"
          >
            <AlertTriangle className="h-3 w-3" />
            نقض SLA
          </span>
        ) : null}
      </div>
    ),
  },
  {
    key: 'assignedTo',
    header: 'پشتیبان',
    cell: (ticket) =>
      ticket.assignedTo ? (
        <span className="text-sm">{ticket.assignedTo.fullName}</span>
      ) : (
        <span className="text-xs text-muted-foreground">تخصیص نیافته</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'تاریخ ثبت',
    cell: (ticket) => (
      <span className="text-sm text-muted-foreground">
        {formatJalaliDateTime(ticket.createdAt)}
      </span>
    ),
  },
];

/**
 * لیست تیکت‌های پشتیبانی — `GET /support/tickets`
 *
 * فیلترها روی وضعیت، اولویت، تخصیص‌نیافته و نقض SLA اعمال می‌شوند و
 * با کلیک روی یک ردیف به صفحه‌ی جزئیات تیکت می‌رود.
 */
export default function SupportPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('all');
  const [category, setCategory] = useState<SupportTicketCategory | 'all'>('all');
  const [unassigned, setUnassigned] = useState(false);
  const [slaBreached, setSlaBreached] = useState(false);
  const [search, setSearch] = useState('');

  const params: SupportTicketListParams = {
    page,
    limit: PAGE_SIZE,
    ...(status !== 'all' ? { status } : {}),
    ...(priority !== 'all' ? { priority } : {}),
    ...(category !== 'all' ? { category } : {}),
    ...(unassigned ? { unassigned: 'true' } : {}),
    ...(slaBreached ? { slaBreached: 'true' } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  };

  const { data, isLoading, isError, error, refetch } =
    useSupportTickets(params);
  const tickets = data?.data ?? [];
  const totalPages = data?.totalPages ?? 0;

  /** بازنشانی همه‌ی فیلترها به حالت اولیه */
  function resetFilters() {
    setPage(1);
    setStatus('all');
    setPriority('all');
    setCategory('all');
    setUnassigned(false);
    setSlaBreached(false);
    setSearch('');
  }

  const hasActiveFilter =
    status !== 'all' ||
    priority !== 'all' ||
    category !== 'all' ||
    unassigned ||
    slaBreached ||
    search.trim() !== '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="پشتیبانی"
        description="مدیریت تیکت‌های پشتیبانی مشتریان و پاسخ به آن‌ها"
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* جستجو در موضوع و کد پیگیری سفارش */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجو در موضوع یا کد پیگیری..."
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            className="pr-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1);
            setStatus(value as StatusFilter);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه‌ی وضعیت‌ها</SelectItem>
            {(Object.keys(TICKET_STATUS_LABELS) as SupportTicketStatus[]).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {TICKET_STATUS_LABELS[value]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(value) => {
            setPage(1);
            setPriority(value as PriorityFilter);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="اولویت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه‌ی اولویت‌ها</SelectItem>
            {(
              Object.keys(TICKET_PRIORITY_LABELS) as SupportTicketPriority[]
            ).map((value) => (
              <SelectItem key={value} value={value}>
                {TICKET_PRIORITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(value) => {
            setPage(1);
            setCategory(value as SupportTicketCategory | 'all');
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="دسته‌بندی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه‌ی دسته‌ها</SelectItem>
            {(
              Object.keys(TICKET_CATEGORY_LABELS) as SupportTicketCategory[]
            ).map((value) => (
              <SelectItem key={value} value={value}>
                {TICKET_CATEGORY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* فیلترهای پرچم‌دار — دکمه‌های قابل‌فعال‌کردن */}
        <Button
          type="button"
          variant={unassigned ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setPage(1);
            setUnassigned((value) => !value);
          }}
        >
          تخصیص‌نیافته
        </Button>
        <Button
          type="button"
          variant={slaBreached ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => {
            setPage(1);
            setSlaBreached((value) => !value);
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          نقض SLA
        </Button>

        {hasActiveFilter ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>

      <DataTable<SupportTicket>
        columns={COLUMNS}
        data={tickets}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        rowKey={(ticket) => ticket.id}
        onRowClick={(ticket) => router.push(`/support/${ticket.id}`)}
        emptyTitle="تیکتی وجود ندارد"
        emptyDescription="با ثبت اولین تیکت پشتیبانی، اینجا نمایش داده می‌شود."
      />

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
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
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}