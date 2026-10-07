'use client';

import { LifeBuoy, MessageSquare, Phone } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="پشتیبانی"
        description="مدیریت تیکت‌ها و درخواست‌های پشتیبانی کاربران"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تیکت‌های باز
            </CardTitle>
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">۳</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              میانگین زمان پاسخ
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">۲۴ دقیقه</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تماس‌های امروز
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">۱۷</p>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        icon={LifeBuoy}
        title="سیستم تیکت در حال توسعه است"
        description="ماژول تیکتینگ پشتیبانی در فاز بعدی به پنل اضافه می‌شود."
      />
    </div>
  );
}
