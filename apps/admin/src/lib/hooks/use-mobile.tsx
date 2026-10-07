'use client';

import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * آیا viewport فعلی موبایل است؟ (< 768px)
 *
 * مطابق با نقطه شکست `md` در Tailwind.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
