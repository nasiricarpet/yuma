'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toPersianDigits } from '@yuma/persian';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAssessmentList } from '@/lib/api/endpoints/orders';
import { ApiError } from '@/lib/api/client';
import { MOCK_ASSESSMENT_ROWS } from '@/lib/api/mock';
import { formatElapsed, formatJalali, toFa } from '@/lib/utils/format';
import type {
  AssessmentListRow,
  WaitingTimeFilter,
} from '@/lib/types';
import { WAITING_TIME_FILTER_LABELS } from '@/lib/types';

/**
 * صفحه لیست ارزیابی — صف سفارش‌هایی که به کارگاه رسیده‌اند و
 * منتظر ارزیابی کارشناس هستند.
 *
 * فیلتر «زمان انتظار» اولویت‌بندی کار را نشان می‌دهد: سفارش‌هایی که
 * بیشتر از ۷۲ ساعت در انتظار هستند باید زودتر بررسی شوند.
 */
export default function AssessmentListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<WaitingTimeFilter>('all');
  const [rows, setRows] = useState<AssessmentListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (current: WaitingTimeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAssessmentList(current);
      setRows(response.rows);
    } catch (cause) {
      // سرور در دسترس نیست — داده‌های نمونه برای پیش‌نمایش رابط کاربری
      if (cause instanceof ApiError || cause instanceof Error) {
        setRows(filterMockRows(current));
      } else {
        setError('خطای ناشناخته رخ داد.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const summary = useMemo(() => summarize(rows), [rows]);

  const handleRowClick = (orderId: string) => {
    router.push(`/assessment/${orderId}`);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">ارزیابی سفارش‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            سفارش‌های رسیده به کارگاه را ارزیابی و قیمت‌گذاری کنید
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="waiting-time-filter"
            className="text-sm font-medium text-muted-foreground"
          >
            زمان انتظار
          </label>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as WaitingTimeFilter)}
          >
            <SelectTrigger
              id="waiting-time-filter"
              className="w-44"
              aria-label="فیلتر زمان انتظار"
            >
              <SelectValue placeholder="همه" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(WAITING_TIME_FILTER_LABELS) as WaitingTimeFilter[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {WAITING_TIME_FILTER_LABELS[key]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="در انتظار ارزیابی" value={summary.total} />
        <SummaryCard
          label="زیر ۲۴ ساعت"
          value={summary.under24}
          tone="success"
        />
        <SummaryCard
          label="بیش از ۷۲ ساعت"
          value={summary.over72}
          tone={summary.over72 > 0 ? 'destructive' : 'muted'}
        />
      </section>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="flex items-center gap-2 p-6 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال بارگذاری…
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              سفارشی در این بازه زمانی وجود ندارد.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد پیگیری</TableHead>
                  <TableHead>مشتری</TableHead>
                  <TableHead>تعداد آیتم</TableHead>
                  <TableHead>زمان انتظار</TableHead>
                  <TableHead>تاریخ ورود</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.orderId}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(row.orderId)}
                  >
                    <TableCell className="num font-medium">
                      {toFa(row.trackingCode)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.customerName}</div>
                      {row.customerMobile ? (
                        <div className="num mt-0.5 text-xs text-muted-foreground" dir="ltr">
                          {toFa(row.customerMobile)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="num">
                      {toPersianDigits(row.itemCount)}
                    </TableCell>
                    <TableCell>
                      <WaitingTimeBadge arrivedAt={row.arrivedAt} />
                      <span className="num mt-0.5 block text-xs text-muted-foreground">
                        {formatElapsed(row.arrivedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="num text-muted-foreground">
                      {formatJalali(row.arrivedAt)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Link href={`/assessment/${row.orderId}`}>
                          ارزیابی
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  tone = 'muted',
}: {
  label: string;
  value: number;
  tone?: 'muted' | 'success' | 'destructive';
}) {
  const valueClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'destructive'
        ? 'text-destructive'
        : 'text-foreground';

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`num mt-2 text-2xl font-bold ${valueClass}`}>
          {toPersianDigits(value)}
        </p>
      </CardContent>
    </Card>
  );
}

/** نشان رنگی زمان انتظار بر اساس مدت زمان گذشته از ورود سفارش */
function WaitingTimeBadge({ arrivedAt }: { arrivedAt: string }) {
  const hours = (Date.now() - new Date(arrivedAt).getTime()) / 3_600_000;

  if (hours < 24) {
    return <Badge variant="success">زیر ۲۴ ساعت</Badge>;
  }
  if (hours <= 72) {
    return <Badge variant="warning">۲۴ تا ۷۲ ساعت</Badge>;
  }
  return <Badge variant="destructive">بیش از ۷۲ ساعت</Badge>;
}

function summarize(rows: AssessmentListRow[]) {
  const hours = rows.map(
    (row) => (Date.now() - new Date(row.arrivedAt).getTime()) / 3_600_000,
  );
  return {
    total: rows.length,
    under24: hours.filter((h) => h < 24).length,
    over72: hours.filter((h) => h > 72).length,
  };
}

/** اعمال فیلتر روی داده‌های نمونه — زمانی که API در دسترس نیست */
function filterMockRows(filter: WaitingTimeFilter): AssessmentListRow[] {
  if (filter === 'all') return MOCK_ASSESSMENT_ROWS;

  return MOCK_ASSESSMENT_ROWS.filter((row) => {
    const hours = (Date.now() - new Date(row.arrivedAt).getTime()) / 3_600_000;
    if (filter === 'under_24h') return hours < 24;
    if (filter === '24_to_72h') return hours >= 24 && hours <= 72;
    return hours > 72;
  });
}
