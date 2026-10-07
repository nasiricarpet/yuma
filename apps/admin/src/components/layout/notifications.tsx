'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const SAMPLE_NOTIFICATIONS = [
  { id: 1, title: 'سفارش جدید', body: 'سفارش YM-1024 ثبت شد', time: '۵ دقیقه پیش' },
  { id: 2, title: 'پرداخت موفق', body: 'پرداخت سفارش YM-1018 تأیید شد', time: '۲۰ دقیقه پیش' },
];

export function Notifications() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-yuma-600" />
          <span className="sr-only">اعلان‌ها</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-semibold">اعلان‌ها</span>
          <span className="text-xs text-muted-foreground">۲ مورد جدید</span>
        </div>
        <Separator />
        <ScrollArea className="h-64">
          <ul className="divide-y">
            {SAMPLE_NOTIFICATIONS.map((n) => (
              <li key={n.id} className="p-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                  {n.time}
                </p>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
