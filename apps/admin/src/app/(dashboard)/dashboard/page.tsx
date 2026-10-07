'use client';

import { useMemo } from 'react';
import {
  Banknote,
  Bike,
  ClipboardList,
  ShoppingBag,
  TrendingUp,
  PieChart,
} from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { LoadingState } from '@/components/common/loading-state';
import { ErrorState } from '@/components/common/error-state';
import { LineChart } from '@/components/charts/line-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDashboardStats } from '@/lib/api/queries/use-dashboard';
import { formatToman, toFa } from '@/lib/utils/format';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();

  // دادهٔ نمودار درآمد — برچسب و درآمد هر دوره
  const revenueChartData = useMemo(
    () =>
      (stats?.revenueData ?? []).map((point) => ({
        label: point.label,
        value: point.revenue,
      })),
    [stats?.revenueData],
  );

  // سهم تعداد سفارش هر دوره برای نمودار دوناتی
  const ordersChartData = useMemo(
    () =>
      (stats?.revenueData ?? []).map((point) => ({
        name: point.label,
        value: point.orders,
      })),
    [stats?.revenueData],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" description="نمای کلی پلتفرم یوما" />
        <LoadingState rows={4} />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="داشبورد" description="نمای کلی پلتفرم یوما" />
        <ErrorState
          title="بارگذاری آمار ناموفق بود"
          message="دریافت اطلاعات داشبورد با خطا مواجه شد. لطفاً دوباره تلاش کنید."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="داشبورد" description="نمای کلی پلتفرم یوما" />

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="کل سفارش‌ها"
          value={toFa(stats.totalOrders)}
          icon={ShoppingBag}
          iconClassName="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
          hint={`در حال حاضر ${toFa(stats.activeOrders)} سفارش فعال`}
        />
        <StatCard
          label="درآمد کل"
          value={formatToman(stats.totalRevenue)}
          icon={Banknote}
          iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          hint="مجموع درآمد ثبت‌شده"
        />
        <StatCard
          label="سفیران فعال"
          value={toFa(stats.activeDrivers)}
          icon={Bike}
          iconClassName="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
          hint={`از مجموع ${toFa(stats.totalDrivers)} سفیر`}
        />
        <StatCard
          label="قالیشویی‌های فعال"
          value={toFa(stats.totalWorkshops)}
          icon={ClipboardList}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          hint={`${toFa(stats.totalCustomers)} مشتری ثبت‌شده`}
        />
      </div>

      {/* نمودارها */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              روند درآمد
            </CardTitle>
            <CardDescription>درآمد دوره‌ای پلتفرم به تومان</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <LineChart
                data={revenueChartData}
                height={280}
                formatValue={(value) => formatToman(value)}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                داده‌ای برای نمایش وجود ندارد
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              توزیع سفارش‌ها
            </CardTitle>
            <CardDescription>سهم هر دوره از تعداد سفارش‌ها</CardDescription>
          </CardHeader>
          <CardContent>
            {ordersChartData.length > 0 ? (
              <DonutChart
                data={ordersChartData}
                height={280}
                formatValue={(value) => toFa(value)}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                داده‌ای برای نمایش وجود ندارد
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
