import { type VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@yuma/types';
import { cn } from '@/lib/utils/cn';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      tone: {
        neutral:
          'bg-muted text-muted-foreground ring-muted-foreground/20',
        info: 'bg-blue-50 text-blue-700 ring-blue-700/20 dark:bg-blue-950 dark:text-blue-300',
        success:
          'bg-emerald-50 text-emerald-700 ring-emerald-700/20 dark:bg-emerald-950 dark:text-emerald-300',
        warning:
          'bg-amber-50 text-amber-700 ring-amber-700/20 dark:bg-amber-950 dark:text-amber-300',
        danger:
          'bg-red-50 text-red-700 ring-red-700/20 dark:bg-red-950 dark:text-red-300',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
);

export type StatusBadgeProps = VariantProps<typeof statusBadgeVariants> & {
  label: string;
  /** نمایش نقطه رنگی قبل از برچسب */
  dot?: boolean;
  className?: string;
};

export function StatusBadge({
  label,
  tone,
  dot = true,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ tone }), className)}>
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

/**
 * تن رنگی هر وضعیت سفارش — یک Record کامل روی `OrderStatus`.
 */
const ORDER_STATUS_TONE: Record<OrderStatus, NonNullable<StatusBadgeProps['tone']>> = {
  pending: 'neutral',
  assigned: 'info',
  picked_up: 'info',
  at_laundry: 'info',
  quotation_sent: 'warning',
  quotation_approved: 'info',
  washing: 'info',
  quality_check: 'warning',
  ready: 'success',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

/**
 * بج وضعیت سفارش — مقدار `OrderStatus` از `@yuma/types` می‌گیرد و
 * برچسب فارسی آن را از `ORDER_STATUS_LABELS` می‌خواند.
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <StatusBadge
      label={ORDER_STATUS_LABELS[status] ?? status}
      tone={ORDER_STATUS_TONE[status]}
      className={className}
    />
  );
}
