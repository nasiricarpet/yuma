'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [panelName, setPanelName] = useState('یوما');
  const [supportEmail, setSupportEmail] = useState('support@yuma.ir');
  const [phone, setPhone] = useState('02100000000');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // این فرم فقط استیت محلی دارد — اتصال به API در فاز بعدی انجام می‌شود
    toast.success('تنظیمات با موفقیت ذخیره شد', {
      description: `نام پنل «${panelName}» به‌روزرسانی شد.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات"
        description="پیکربندی پنل ادمین و امکانات پلتفرم"
      />

      <Card>
        <CardHeader>
          <CardTitle>اطلاعات پنل</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panelName">نام پنل</Label>
              <Input
                id="panelName"
                value={panelName}
                onChange={(event) => setPanelName(event.target.value)}
                placeholder="نام پنل را وارد کنید"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportEmail">ایمیل پشتیبانی</Label>
              <Input
                id="supportEmail"
                type="email"
                dir="ltr"
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                placeholder="support@example.com"
                className="text-left"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">شماره تماس</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="02100000000"
                className="text-left"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit">ذخیره تغییرات</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>عمومی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingRow
            label="اعلان‌های ایمیلی"
            description="دریافت خلاصه روزانه در ایمیل"
            defaultChecked
          />
          <Separator />
          <SettingRow
            label="اعلان سفارش جدید"
            description="اطلاع‌رسانی فوری هنگام ثبت سفارش جدید"
            defaultChecked
          />
          <Separator />
          <SettingRow
            label="حالت تاریک پیش‌فرض"
            description="استفاده از تم تاریک برای کاربران جدید"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>امنیت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SettingRow
            label="تأیید دو مرحله‌ای"
            description="الزامی بودن کد یکتا در هر ورود"
            defaultChecked
          />
          <Separator />
          <SettingRow
            label="مدت زمان نشست"
            description="خروج خودکار پس از ۳۰ دقیقه غیرفعالیتی"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
