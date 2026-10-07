import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * ترکیب کلاس‌های شرطی و حل تعارض‌های Tailwind.
 *
 * @example
 * cn('px-2 py-1', isActive && 'bg-primary', 'px-4')
 * // => 'py-1 bg-primary px-4'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
