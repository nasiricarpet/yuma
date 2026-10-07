import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export type StatCardProps = {
  /** برچسب فارسی آمار — مثلا «کل سفارش‌ها» */
  label: string;
  /** مقدار نمایش داده شده — می‌تواند متن قالب‌بندی‌شده باشد */
  value: ReactNode;
  /** نماد لوکاید در گوشهٔ کارت */
  icon: LucideIcon;
  /** رنگ لهجهٔ نماد — کلاس‌های Tailwind برای پس‌زمینه و رنگ */
  iconClassName?: string;
  /** توضیح کوتاه زیر مقدار */
  hint?: ReactNode;
  className?: string;
};

/**
 * کارت آماری داشبورد — نماد، برچسب، مقدار بزرگ و توضیح اختیاری.
 *
 * @example
 * <StatCard
 *   label="کل سفارش‌ها"
 *   value={toFa(stats.totalOrders)}
 *   icon={ShoppingBag}
 *   hint="در ۳۰ روز گذشته"
 * />
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary',
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
