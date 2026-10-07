'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronLeft } from 'lucide-react';
import { navTitleByHref } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';

/**
 * Breadcrumb با سوییچ RTL: از مسیر فعلی برش‌های حرکت می‌کند.
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const isLast = index === segments.length - 1;
    const title =
      navTitleByHref(href) ??
      (index === 0 ? segment : decodeURIComponent(segment));

    return { href, title, isLast };
  });

  return (
    <nav aria-label="مسیر صفحه" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => {
        const Icon = index === 0 ? null : ChevronLeft;

        return (
          <Fragment key={crumb.href}>
            {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground/60" /> : null}
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.title}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-muted-foreground transition-colors hover:text-foreground',
                )}
              >
                {crumb.title}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
