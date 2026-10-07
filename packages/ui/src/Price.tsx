/**
 * نمایش مبلغ با ارقام فارسی و واحد تومان
 */
import { formatCurrency } from '@yuma/persian';
import type { CurrencyUnit } from './types';

export interface PriceProps {
  amount: number;
  unit?: CurrencyUnit;
  className?: string;
}

export function Price({ amount, unit = 'toman', className = '' }: PriceProps) {
  return (
    <span dir="rtl" className={`font-medium tabular-nums ${className}`}>
      {formatCurrency(amount, unit)}
    </span>
  );
}
