'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge, type StatusBadgeProps } from '@/components/common/status-badge';
import { formatToman, toFa } from '@/lib/utils/format';
import { useQuotations } from '@/lib/api/queries/use-pricing';
import {
  QUOTATION_STATUS_LABELS,
  type Quotation,
  type QuotationStatus,
} from '@/types';

const STATUS_TONE: Record<QuotationStatus, NonNullable<StatusBadgeProps['tone']>> = {
  draft: 'neutral',
  sent: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const COLUMNS: Column<Quotation>[] = [
  {
    key: 'orderId',
    header: 'شماره سفارش (orderId)',
    cell: (quotation) => (
      <span dir="ltr" className="font-mono text-xs">
        {quotation.orderId}
      </span>
    ),
  },
  {
    key: 'totalAmount',
    header: 'مبلغ کل',
    cell: (quotation) => formatToman(quotation.totalAmount),
  },
  {
    key: 'status',
    header: 'وضعیت',
    cell: (quotation) => (
      <StatusBadge
        label={QUOTATION_STATUS_LABELS[quotation.status]}
        tone={STATUS_TONE[quotation.status]}
        dot
      />
    ),
  },
];

export default function PricingPage() {
  const { data: response, isLoading } = useQuotations();
  const quotations = response?.data ?? [];

  // آمار بالا از دادهٔ واقعی محاسبه می‌شود
  const stats = useMemo(() => {
    const rows = response?.data ?? [];
    const count = rows.length;
    const total = rows.reduce((sum, q) => sum + q.totalAmount, 0);
    const approved = rows.filter((q) => q.status === 'approved').length;
    const pending = rows.filter((q) => q.status === 'sent').length;

    return {
      average: count ? Math.round(total / count) : 0,
      approvalRate: count ? Math.round((approved / count) * 100) : 0,
      pending,
    };
  }, [response]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="قیمت‌گذاری"
        description="مدیریت پیش‌فاکتورها و تعرفه خدمات"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط مبلغ پیش‌فاکتور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatToman(stats.average)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              نرخ تأیید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">٪{toFa(stats.approvalRate)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              در انتظار تأیید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{toFa(stats.pending)}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable<Quotation>
        columns={COLUMNS}
        data={quotations}
        isLoading={isLoading}
        rowKey={(quotation) => quotation.id}
        emptyTitle="پیش‌فاکتوری وجود ندارد"
        emptyDescription="وقتی پیش‌فاکتور جدیدی صادر شود در این جدول نمایش داده می‌شود."
      />
    </div>
  );
}
