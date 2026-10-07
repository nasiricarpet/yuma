'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { navigation } from '@/lib/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-l bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-lg font-bold text-yuma-600">یوما</span>
        <span className="text-xs text-muted-foreground">پنل ادمین</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h3 className="px-3 text-xs font-medium text-muted-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-yuma-50 text-yuma-700 dark:bg-yuma-950 dark:text-yuma-300'
                            : 'text-foreground/70 hover:bg-accent hover:text-foreground',
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                        {item.badge ? (
                          <span className="mr-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
