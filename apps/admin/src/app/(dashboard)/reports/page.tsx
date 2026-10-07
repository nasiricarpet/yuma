'use client';

import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/charts/line-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { formatToman } from '@/lib/utils/format';

const MONTHLY_ORDERS = [
  { label: 'فروردین', value: 148 },
  { label: 'اردیبهشت', value: 172 },
  { label: 'خرداد', value: 195 },
  { label: 'تیر', value: 181 },
  { label: 'مرداد', value: 214 },
];

const MONTHLY_REVENUE = [
  { label: 'فروردین', value: 48_200_000 },
  { label: 'اردیبهشت', value: 53_900_000 },
  { label: 'خرداد', value: 61_400_000 },
  { label: 'تیر', value: 58_100_000 },
  { label: 'مرداد', value: 67_300_000 },
];

const CHANNEL_BREAKDOWN = [
  { name: 'اپ مشتری', value: 62 },
  { name: 'وب‌سایت', value: 24 },
  { name: 'تماس', value: 9 },
  { name: 'سایر', value: 5 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="گزارش‌ها"
        description="تحلیل عملکرد پلتفرم در بازه‌های زمانی مختلف"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>روند سفارش‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={MONTHLY_ORDERS} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>روند درآمد</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={MONTHLY_REVENUE} formatValue={formatToman} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>کانال‌های ورودی سفارش</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart data={CHANNEL_BREAKDOWN} />
        </CardContent>
      </Card>
    </div>
  );
}
