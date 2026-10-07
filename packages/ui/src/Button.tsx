/**
 * دکمه با پشتیبانی RTL و اعداد فارسی
 */
import type { ButtonHTMLAttributes } from 'react';
import { toPersianDigits } from '@yuma/persian';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  /** نمایش badge عددی با ارقام فارسی */
  badge?: number;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export function Button({
  variant = 'primary',
  badge,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      dir="rtl"
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
      {typeof badge === 'number' && badge > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-white/25 px-1 text-xs">
          {toPersianDigits(badge)}
        </span>
      )}
    </button>
  );
}
