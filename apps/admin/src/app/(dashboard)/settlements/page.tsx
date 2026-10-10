'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Calculator, Check, X } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  useMarkSettlementPaid,
  usePreviewSettlement,
  useSettlements,
} from '@/lib/api/queries/use-settlements';
import { useLaundries } from '@/lib/api/queries/use-laundries';
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_TONE,
  type Settlement,
  type SettlementListParams,
  type SettlementStatus,
  type Workshop,
} from '@/types';
import { formatJalali, formatToman, toFa } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/lib/utils/errors';

/** تعداد تسویه در هر صفحه */
const PAGE_SIZE = 20;

type StatusFilter = SettlementStatus | 'all';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * تسویه‌ی دوره‌ای کارگاه‌ها — `GET /admin/settlements`
 *
 * @see apps/api/src/modules/ledger/settlements.controller.ts
 */
export default function SettlementsPage() {
  const [workshopId, setWorkshopId] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);

  // حالت محاسبه‌ی زنده‌ی یک دوره
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcWorkshop, setCalcWorkshop] = useState('all');
  const [calcMonth, setCalcMonth] = useState('');

  // حالت ثبت پرداخت
  const [paidTarget, setPaidTarget] = useState<Settlement | null>(null);
  const [reference, setReference] = useState('');

  const { data: laundries } = useLaundries();
  const workshopName = useMemo(() => {
    const map = new Map<string, string>();
    (laundries?.data ?? []).forEach((item) => map.set(item.id, item.name));
    return map;
  }, [laundries]);

  const params = useMemo<SettlementListParams>(() => {
    const query: SettlementListParams = { page, limit: PAGE_SIZE };
    if (workshopId !== 'all') query.workshopId = workshopId;
    if (status !== 'all') query.status = status;
    if (MONTH_PATTERN.test(month.trim())) query.month = month.trim();
    return query;
  }, [workshopId, status, month, page]);

  const { data, isLoading, isError, refetch } = useSettlements(params);
  const preview = usePreviewSettlement();
  const markPaid = useMarkSettlementPaid();

  const hasFilter = workshopId !== 'all' || status !== 'all' || month.trim() !== '';

  // باز کردن دیالوگ محاسبه — فیلترهای جاری به‌عنوان پیش‌فرض پر می‌شوند
  const openCalculate = () => {
    setCalcWorkshop(workshopId);
    setCalcMonth(month.trim());
    setCalcOpen(true);
  };

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setWorkshopId('all');
    setStatus('all');
    setMonth('');
    setPage(1);
  };

  const handlePreview = () => {
    if (calcWorkshop === 'all') {
      toast.error('ابتدا یک کارگاه انتخاب کنید');
      return;
    }
    if (!MONTH_PATTERN.test(calcMonth.trim())) {
      toast.error('فرمت ماه نامعتبر است — مثال: 2026-09');
      return;
    }

    preview.mutate(
      { workshopId: calcWorkshop, month: calcMonth.trim() },
      {
        onSuccess: (result) => {
          toast.success(
            `دوره محاسبه شد — خالص قابل پرداخت: ${formatToman(Number(result.netPayableMinor))}`,
          );
          setCalcOpen(false);
          setCalcMonth('');
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleMarkPaid = () => {
    if (!paidTarget) return;

    markPaid.mutate(
      { id: paidTarget.id, reference: reference.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('تسویه به‌عنوان پرداخت‌شده ثبت شد');
          setPaidTarget(null);
          setReference('');
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const columns: Column<Settlement>[] = [
    {
      key: 'workshop',
      header: 'کارگاه',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.workshop?.name ?? workshopName.get(row.workshopId) ?? '—'}
          </span>
          {row.workshop?.city ? (
            <span className="text-xs text-muted-foreground">
              {row.workshop.city}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'period',
      header: 'دوره',
      cell: (row) => (
        <div className="flex flex-col tabular-nums">
          <span>{formatJalali(row.periodStart)}</span>
          <span className="text-xs text-muted-foreground">
            تا {formatJalali(new Date(new Date(row.periodEnd).getTime() - 1))}
          </span>
        </div>
      ),
    },
    {
      key: 'grossMinor',
      header: 'گردش دوره',
      className: 'tabular-nums whitespace-nowrap',
      cell: (row) => formatToman(Number(row.grossMinor)),
    },
    {
      key: 'commissionMinor',
      header: 'کارمزد پلتفرم',
      className: 'tabular-nums whitespace-nowrap text-muted-foreground',
      cell: (row) => formatToman(Number(row.commissionMinor)),
    },
    {
      key: 'netPayableMinor',
      header: 'خالص قابل پرداخت',
      className: 'tabular-nums whitespace-nowrap font-medium',
      cell: (row) => formatToman(Number(row.netPayableMinor)),
    },
    {
      key: 'status',
      header: 'وضعیت',
      cell: (row) => (
        <StatusBadge
          label={SETTLEMENT_STATUS_LABELS[row.status]}
          tone={SETTLEMENT_STATUS_TONE[row.status]}
        />
      ),
    },
    {
      key: 'paidAt',
      header: 'تاریخ پرداخت',
      cell: (row) =>
        row.paidAt ? (
          <div className="flex flex-col tabular-nums">
            <span>{formatJalali(row.paidAt)}</span>
            {row.reference ? (
              <span dir="ltr" className="text-xs text-muted-foreground">
                {row.reference}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-left',
      cell: (row) =>
        row.status === 'pending' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPaidTarget(row);
              setReference(row.reference ?? '');
            }}
          >
            <Check className="h-4 w-4" />
            ثبت پرداخت
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">تسویه شده</span>
        ),
    },
  ];

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const pendingTotal = items
    .filter((row) => row.status === 'pending')
    .reduce((sum, row) => sum + Number(row.netPayableMinor), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تسویه کارگاه‌ها"
        description="محاسبه و پرداخت سهم دوره‌ای قالیشویی‌ها"
        actions={
          <Button onClick={openCalculate}>
            <Calculator className="h-4 w-4" />
            محاسبه دوره
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:flex-wrap">
        <Select
          value={workshopId}
          onValueChange={(value) => {
            setWorkshopId(value);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full lg:w-48" aria-label="فیلتر کارگاه">
            <SelectValue placeholder="همه کارگاه‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه کارگاه‌ها</SelectItem>
            {(laundries?.data ?? []).map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as StatusFilter);
            resetPage();
          }}
        >
          <SelectTrigger className="w-full lg:w-40" aria-label="فیلتر وضعیت">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="pending">{SETTLEMENT_STATUS_LABELS.pending}</SelectItem>
            <SelectItem value="paid">{SETTLEMENT_STATUS_LABELS.paid}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
            resetPage();
          }}
          placeholder="دوره (YYYY-MM)"
          dir="ltr"
          className="w-full lg:w-44 tabular-nums"
          aria-label="فیلتر دوره"
        />

        {hasFilter ? (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
            پاک کردن فیلترها
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="font-medium">{toFa(data?.total ?? 0)} تسویه</span>
        {pendingTotal > 0 ? (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              خالص در انتظار پرداخت (صفحه جاری):{' '}
              <span className="font-medium text-foreground">
                {formatToman(pendingTotal)}
              </span>
            </span>
          </>
        ) : null}
      </div>

      <DataTable<Settlement>
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowKey={(row) => row.id}
        emptyTitle="تسویه‌ای یافت نشد"
        emptyDescription="هنوز دوره‌ای برای این کارگاه‌ها محاسبه نشده است."
      />

      {totalPages > 1 ? (
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

      <CalculatePeriodDialog
        open={calcOpen}
        onOpenChange={setCalcOpen}
        workshops={laundries?.data ?? []}
        workshop={calcWorkshop}
        onWorkshopChange={setCalcWorkshop}
        month={calcMonth}
        onMonthChange={setCalcMonth}
        onConfirm={handlePreview}
        isCalculating={preview.isPending}
      />

      <MarkPaidDialog
        settlement={paidTarget}
        open={Boolean(paidTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setPaidTarget(null);
            setReference('');
          }
        }}
        reference={reference}
        onReferenceChange={setReference}
        onConfirm={handleMarkPaid}
        isSaving={markPaid.isPending}
      />
    </div>
  );
}

type CalculatePeriodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshops: Workshop[];
  workshop: string;
  onWorkshopChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  onConfirm: () => void;
  isCalculating: boolean;
};

/**
 * محاسبه‌ی زنده‌ی تسویه‌ی یک دوره —
 * سرویس بک‌اند قلم‌های کارگاه را جمع کرده و ردیف را upsert می‌کند.
 */
function CalculatePeriodDialog({
  open,
  onOpenChange,
  workshops,
  workshop,
  onWorkshopChange,
  month,
  onMonthChange,
  onConfirm,
  isCalculating,
}: CalculatePeriodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>محاسبه تسویه دوره</DialogTitle>
          <DialogDescription>
            قلم‌های کارگاه در بازه‌ی انتخاب‌شده جمع می‌شوند و یک ردیف تسویه می‌سازند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={workshop} onValueChange={onWorkshopChange}>
            <SelectTrigger aria-label="انتخاب کارگاه">
              <SelectValue placeholder="یک کارگاه انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {workshops.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            placeholder="2026-09"
            dir="ltr"
            className="tabular-nums"
            aria-label="دوره"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={onConfirm} disabled={isCalculating}>
            {isCalculating ? 'در حال محاسبه…' : 'محاسبه'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type MarkPaidDialogProps = {
  settlement: Settlement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
};

/** تأیید پرداخت تسویه — مرجع حواله/فیش اختیاری است */
function MarkPaidDialog({
  settlement,
  open,
  onOpenChange,
  reference,
  onReferenceChange,
  onConfirm,
  isSaving,
}: MarkPaidDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ثبت پرداخت تسویه</DialogTitle>
          <DialogDescription>
            {settlement
              ? `${settlement.workshop?.name ?? 'کارگاه'} — دوره ${formatJalali(
                  settlement.periodStart,
                )} — خالص قابل پرداخت ${formatToman(
                  Number(settlement.netPayableMinor),
                )}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="settlement-reference" className="text-sm font-medium">
            مرجع پرداخت (اختیاری)
          </label>
          <Input
            id="settlement-reference"
            value={reference}
            onChange={(event) => onReferenceChange(event.target.value)}
            placeholder="شناسه حواله یا فیش"
            dir="ltr"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? 'در حال ثبت…' : 'ثبت به‌عنوان پرداخت‌شده'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
