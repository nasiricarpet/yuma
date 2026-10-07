'use client';

import { forwardRef, useState, useCallback } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { formatDecimal } from '@yuma/persian';

export type CurrencyInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: number | null;
  onValueChange?: (value: number | null) => void;
};

/**
 * ورودی مبلغ به ریال — هنگام خروج فوکوس، ارقام با جداکننده فارسی نمایش می‌شود
 * و مقدار عددی خام در `onValueChange` تحویل داده می‌شود.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onValueChange, ...props }, ref) {
    const [focused, setFocused] = useState(false);

    const displayValue = focused
      ? value?.toString() ?? ''
      : value != null && Number.isFinite(value)
        ? formatDecimal(value, 0)
        : '';

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^\d۰-۹٠-٩]/g, '');
        const latin = digits
          .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
        onValueChange?.(latin === '' ? null : Number(latin));
      },
      [onValueChange],
    );

    return (
      <div className="relative">
        <Input
          ref={ref}
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          ریال
        </span>
      </div>
    );
  },
);
