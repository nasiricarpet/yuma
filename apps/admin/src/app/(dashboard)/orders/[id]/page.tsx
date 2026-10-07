'use client';

import { use, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { OrderStatus } from '@yuma/types';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatJalali, formatJalaliDateTime, formatToman } from '@/lib/utils/format';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order] = useState<null | {
    trackingCode: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
  }>(null);

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به سفارش‌ها
        </Link>
        <EmptyState
          title="سفارش یافت نشد"
          description={`سفارش با شناسه ${id} وجود ندارد یا حذف شده است.`}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`جزئیات سفارش ${order.trackingCode}`}
        description={formatJalaliDateTime(order.createdAt)}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>اطلاعات سفارش</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="کد پیگیری" value={order.trackingCode} />
              <DetailItem label="وضعیت" value={order.status} />
              <DetailItem
                label="مبلغ کل"
                value={formatToman(order.totalAmount)}
              />
              <DetailItem
                label="تاریخ ثبت"
                value={formatJalali(order.createdAt)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              تاریخچه وضعیت‌های سفارش در این بخش نمایش داده می‌شود.
            </p>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground/70">
              این صفحه به محض اتصال به endpoint جزئیات سفارش پر می‌شود.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
