'use client';

import * as React from 'react';

/**
 * مقدار را با تاخیر debounce می‌کند — مناسب فیلدهای جستجو.
 *
 * @param value مقدار ورودی
 * @param delay میلی‌ثانیه (پیش‌فرض ۳۰۰)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
