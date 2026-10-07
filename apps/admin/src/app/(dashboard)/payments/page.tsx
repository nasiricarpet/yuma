'use client';

import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { StatusBadge, type StatusBadgeProps } from '@/components/common/status-badge';
import { formatToman } from '@/lib/utils/format';
import { usePayments } from '@/lib/api/queries/use-payments';
import type { Payment } from '@/types';

const STATUS_TONE: Record<Payment['status'], NonNullable<StatusBadgeProps['tone']>> = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

const STATUS_LABEL: Record<Payment['status'], string> = {
  pending: 'در انتظار',
  success: 'موفق',
  failed: 'ناموفق',
  refunded: 'بازگشت‌داده‌شده',
};

const COLUMNS: Column<Payment>[] = [
  {
    key: 'orderId',
    header: 'شماره سفارش (orderId)',
    cell: (payment) => (
      <span dir="ltr" className="font-mono text-xs">
        {payment.orderId}
      </span>
    ),
  },
  {
    key: 'amount',
    header: 'مبلغ پرداخت',
    cell: (payment) => formatToman(payment.amount),
  },
  {
    key: 'referenceId',
    header: 'کد رهگیری (referenceId)',
    cell: (payment) =>
      payment.referenceId ? (
        <span dir="ltr" className="font-mono text-xs">
          {payment.referenceId}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'status',
    header: 'وضعیت',
    cell: (payment) => (
      <StatusBadge
        label={STATUS_LABEL[payment.status]}
        tone={STATUS_TONE[payment.status]}
        dot
      />
    ),
  },
];

export default function PaymentsPage() {
  const { data: response, isLoading } = usePayments();
  const payments = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="پرداخت‌ها"
        description="مدیریت تراکنش‌های پرداخت و تسویه حساب"
      />

      <DataTable<Payment>
        columns={COLUMNS}
        data={payments}
        isLoading={isLoading}
        rowKey={(payment) => payment.id}
        emptyTitle="پرداختی وجود ندارد"
        emptyDescription="وقتی تراکنش جدیدی ثبت شود در این جدول نمایش داده می‌شود."
      />
    </div>
  );
}
