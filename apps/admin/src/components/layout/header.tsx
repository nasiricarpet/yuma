'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Breadcrumb } from './breadcrumb';
import { Notifications } from './notifications';
import { UserMenu } from './user-menu';
import { Sidebar } from './sidebar';
import { ThemeToggle } from '@/components/common/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">منو</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <Breadcrumb />
      </div>

      <div className="mr-auto flex items-center gap-1">
        <ThemeToggle />
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
