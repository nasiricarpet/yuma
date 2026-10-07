'use client';

import { forwardRef, useCallback } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { normalizeMobile } from '@yuma/validators';

export type MobileInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

/**
 * ورودی موبایل — پیشوند +۹۸ ثابت و خروجی نرمال‌شده `09xxxxxxxxx`.
 * ارقام فارسی/عربی و فاصله/خط تیره را هم پذیرفته و نرمال می‌کند.
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  function MobileInput({ value, onValueChange, ...props }, ref) {
    const normalized = value ? normalizeMobile(value) : '';
    const localPart = normalized.replace(/^0/, '');

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '');
        const withoutLeadingZero = digits.replace(/^0+/, '');
        onValueChange?.(withoutLeadingZero ? `0${withoutLeadingZero}` : '');
      },
      [onValueChange],
    );

    return (
      <div className="flex items-center">
        <span className="inline-flex h-10 select-none items-center rounded-l-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
          +۹۸
        </span>
        <Input
          ref={ref}
          inputMode="numeric"
          dir="ltr"
          className="rounded-l-none rounded-r-md text-left"
          placeholder="9123456789"
          value={localPart}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  },
);
