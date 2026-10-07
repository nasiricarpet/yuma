'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { formatJalaliDate } from '@yuma/persian';
import type { Order } from '@yuma/types';
import { PageHeader } from '@/components/common/page-header';
import { DataTable, type Column } from '@/components/common/data-table';
import { OrderStatusBadge } from '@/components/common/status-badge';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/lib/api/queries/use-orders';

const COLUMNS: Column<Order>[] = [
  {
    key: 'trackingCode',
    header: 'کد پیگیری',
    cell: (order) => order.trackingCode,
  },
  {
    key: 'status',
    header: 'وضعیت',
    cell: (order) => <OrderStatusBadge status={order.status} />,
  },
  {
    key: 'createdAt',
    header: 'تاریخ ثبت',
    cell: (order) => formatJalaliDate(new Date(order.createdAt), 'YYYY/MM/DD'),
  },
];

export default function OrdersPage() {
  const router = useRouter();
  const { data: response, isLoading } = useOrders();
  const orders = response?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="سفارش‌ها"
        description="مدیریت و پیگیری همه سفارش‌های پلتفرم"
        actions={
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            سفارش جدید
          </Button>
        }
      />

      <DataTable<Order>
        columns={COLUMNS}
        data={orders}
        isLoading={isLoading}
        rowKey={(order) => order.id}
        onRowClick={(order) => router.push(`/orders/${order.id}`)}
        emptyTitle="سفارشی یافت نشد"
        emptyDescription="وقتی سفارش جدیدی ثبت شود در اینجا نمایش داده می‌شود."
      />
    </div>
  );
}
