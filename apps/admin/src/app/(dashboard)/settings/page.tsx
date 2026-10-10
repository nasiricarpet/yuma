'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, RotateCcw } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings, useUpdateSetting } from '@/lib/api/queries/use-settings';
import { formatJalaliDateTime, formatToman, toFa } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/lib/utils/errors';
import type { SettingFieldConfig } from '@/types';

/** شناسه تب‌های صفحه‌ی تنظیمات */
type SettingsTabId = 'general' | 'order' | 'payment' | 'features';

interface SettingsTab {
  id: SettingsTabId;
  title: string;
  description: string;
  fields: SettingFieldConfig[];
}

/**
 * رجیستر تب‌ها و فیلدها — منبع واحد فرم تنظیمات.
 * کلیدها منطبق با `DEFAULT_SETTINGS` در seed بک‌اند هستند.
 * @see packages/db/prisma/seed.ts
 */
const SETTING_TABS: SettingsTab[] = [
  {
    id: 'general',
    title: 'عمومی',
    description: 'هویت برند و راه‌های ارتباطی نمایش‌داده‌شده به کاربران',
    fields: [
      {
        key: 'brand.name',
        label: 'نام برند',
        description: 'نام نمایش‌داده‌شده در اپ مشتری و فاکتورها',
        type: 'text',
        placeholder: 'قالیشویی یوما',
        defaultValue: 'قالیشویی یوما',
      },
      {
        key: 'brand.primaryColor',
        label: 'رنگ اصلی برند',
        description: 'کد HEX رنگ اصلی رابط کاربری',
        type: 'color',
        defaultValue: '#4f46e5',
      },
      {
        key: 'contact.phone',
        label: 'شماره تماس',
        description: 'شماره‌ای که مشتریان برای پشتیبانی با آن تماس می‌گیرند',
        type: 'tel',
        placeholder: '04133333333',
        defaultValue: '04133333333',
      },
      {
        key: 'contact.email',
        label: 'ایمیل پشتیبانی',
        description: 'آدرس ایمیل دریافت پیام‌های پشتیبانی',
        type: 'email',
        placeholder: 'support@example.com',
        defaultValue: 'support@yuma.local',
      },
    ],
  },
  {
    id: 'order',
    title: 'سفارش',
    description: 'قوانین لغو، اعتبار کد یکتا و حداقل مبلغ سفارش',
    fields: [
      {
        key: 'order.cancelWindowMinutes',
        label: 'مهلت لغو سفارش',
        description: 'بازه‌ای که مشتری می‌تواند سفارش را بدون جریمه لغو کند',
        type: 'number',
        min: 0,
        suffix: 'دقیقه',
        defaultValue: 30,
      },
      {
        key: 'order.otpTTLSeconds',
        label: 'اعتبار کد یکتا',
        description: 'مدت اعتبار کد تأییدی که برای مشتری ارسال می‌شود',
        type: 'number',
        min: 0,
        suffix: 'ثانیه',
        defaultValue: 120,
      },
      {
        key: 'order.minPrice',
        label: 'حداقل مبلغ سفارش',
        description: 'حداقل مبلغ مجاز برای ثبت سفارش (به ریال)',
        type: 'number',
        min: 0,
        step: 1000,
        suffix: 'ریال',
        isRial: true,
        defaultValue: 150000,
      },
    ],
  },
  {
    id: 'payment',
    title: 'پرداخت',
    description: 'نرخ کمیسیون پلتفرم و تنظیمات ارسال پیامک',
    fields: [
      {
        key: 'payment.commissionRate',
        label: 'نرخ کمیسیون',
        description: 'درصد کمیسیون پلتفرم از مبلغ هر سفارش',
        type: 'number',
        min: 0,
        max: 100,
        suffix: 'درصد',
        defaultValue: 10,
      },
      {
        key: 'sms.enabled',
        label: 'ارسال پیامک',
        description: 'فعال بودن ارسال پیامک تأیید و اطلاع‌رسانی به مشتریان',
        type: 'switch',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'features',
    title: 'امکانات',
    description: 'فعال یا غیرفعال کردن امکانات اختیاری پلتفرم',
    fields: [
      {
        key: 'features.mobile',
        label: 'اپلیکیشن موبایل',
        description: 'در دسترس بودن ثبت سفارش از طریق اپلیکیشن موبایل',
        type: 'switch',
        defaultValue: true,
      },
    ],
  },
];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** مقدار معتبر برای input رنگ — فقط HEX شش‌رقمی پذیرفته می‌شود */
function colorValue(value: unknown): string {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : '#4f46e5';
}

/** تبدیل مقدار ذخیره‌شده به مقدار قابل‌ویرایش در فرم */
function toFieldValue(
  field: SettingFieldConfig,
  stored: unknown,
): string | boolean {
  if (field.type === 'switch') {
    return Boolean(stored ?? field.defaultValue);
  }

  if (field.type === 'number') {
    const num = typeof stored === 'number' ? stored : Number(field.defaultValue ?? 0);
    return Number.isFinite(num) ? String(num) : '0';
  }

  return typeof stored === 'string' ? stored : String(stored ?? '');
}

/** تبدیل مقدار فرم به مقدار ذخیره‌شده در دیتابیس */
function fromFieldValue(field: SettingFieldConfig, raw: string | boolean): unknown {
  if (field.type === 'switch') {
    return Boolean(raw);
  }

  if (field.type === 'number') {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return field.defaultValue ?? 0;
    }

    const clamped = Math.min(
      field.max ?? Number.POSITIVE_INFINITY,
      Math.max(field.min ?? Number.NEGATIVE_INFINITY, parsed),
    );

    return clamped;
  }

  return raw;
}

/** نمایش فارسی مقدار فعلی زیر فیلد — برای فیلدهای عددی و سوییچ */
function describeValue(field: SettingFieldConfig, stored: unknown): string | null {
  if (field.type === 'number') {
    const num = typeof stored === 'number' ? stored : Number(field.defaultValue ?? 0);
    if (!Number.isFinite(num)) {
      return null;
    }

    if (field.isRial) {
      return `${formatToman(num)} تومان`;
    }

    return `${toFa(num)} ${field.suffix ?? ''}`.trim();
  }

  if (field.type === 'switch') {
    return Boolean(stored ?? field.defaultValue) ? 'فعال' : 'غیرفعال';
  }

  return null;
}

/**
 * مجموعه دکمه‌های ذخیره/بازگردانی هر فیلد.
 * تا زمانی که مقدار با سرور یکی است، دکمه‌ها غیرفعال‌اند.
 */
function FieldActions({
  isDirty,
  isSaving,
  onReset,
}: {
  isDirty: boolean;
  isSaving: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button type="submit" size="sm" disabled={!isDirty || isSaving}>
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        ذخیره
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        disabled={!isDirty || isSaving}
      >
        <RotateCcw className="h-4 w-4" />
        بازگردانی
      </Button>
    </div>
  );
}

/** مقدار فعلی و زمان آخرین تغییر زیر فیلد */
function FieldMeta({
  hint,
  updatedAt,
}: {
  hint: string | null;
  updatedAt?: string;
}) {
  if (!hint && !updatedAt) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
      {hint ? <span>{hint}</span> : null}
      {updatedAt ? (
        <span>
          آخرین تغییر: {toFa(formatJalaliDateTime(updatedAt))}
        </span>
      ) : null}
    </div>
  );
}

/**
 * فرم یک تنظیم — مقدار از سرور می‌آید، تغییرات محلی نگه داشته می‌شوند
 * و با دکمه‌ی ذخیره به سرور ارسال می‌شوند.
 */
function SettingField({
  field,
  stored,
  updatedAt,
  onSave,
  isSaving,
}: {
  field: SettingFieldConfig;
  stored: unknown;
  updatedAt?: string;
  onSave: (value: unknown) => void;
  isSaving: boolean;
}) {
  const serverValue = toFieldValue(field, stored);
  const serverKey = JSON.stringify(serverValue);
  const [local, setLocal] = useState(serverValue);
  const [snapshot, setSnapshot] = useState(serverKey);

  // همگام‌سازی با داده‌ی تازه‌ی سرور پس از refetch
  if (serverKey !== snapshot) {
    setSnapshot(serverKey);
    setLocal(serverValue);
  }

  const isDirty = JSON.stringify(local) !== snapshot;
  const hint = describeValue(field, stored);

  if (field.type === 'switch') {
    return (
      <div className="flex items-start justify-between gap-4 py-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium" htmlFor={`setting-${field.key}`}>
            {field.label}
          </Label>
          {field.description ? (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          ) : null}
          <FieldMeta hint={hint} updatedAt={updatedAt} />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id={`setting-${field.key}`}
            checked={local === true}
            onCheckedChange={(checked: boolean) => setLocal(checked)}
            disabled={isSaving}
          />
          <FieldActions
            isDirty={isDirty}
            isSaving={isSaving}
            onReset={() => setLocal(serverValue)}
          />
        </div>
      </div>
    );
  }

  const isLtr = field.type !== 'text';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(fromFieldValue(field, local));
      }}
      className="grid gap-3 py-4 md:grid-cols-[minmax(150px,220px)_minmax(0,1fr)_auto] md:items-start"
    >
      <div className="space-y-1">
        <Label className="text-sm font-medium" htmlFor={`setting-${field.key}`}>
          {field.label}
        </Label>
        {field.description ? (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {field.type === 'color' ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`انتخاب ${field.label}`}
              value={colorValue(local)}
              onChange={(event) => setLocal(event.target.value)}
              disabled={isSaving}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Input
              id={`setting-${field.key}`}
              value={typeof local === 'string' ? local : ''}
              onChange={(event) => setLocal(event.target.value)}
              placeholder="#4f46e5"
              dir="ltr"
              className="text-left"
              disabled={isSaving}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              id={`setting-${field.key}`}
              type={field.type === 'text' ? 'text' : field.type}
              value={typeof local === 'string' ? local : ''}
              onChange={(event) => setLocal(event.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              dir={isLtr ? 'ltr' : undefined}
              className={isLtr ? 'text-left' : undefined}
              disabled={isSaving}
            />
            {field.suffix ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {field.suffix}
              </span>
            ) : null}
          </div>
        )}

        <FieldMeta hint={hint} updatedAt={updatedAt} />
      </div>

      <div className="flex items-center gap-2">
        <FieldActions
          isDirty={isDirty}
          isSaving={isSaving}
          onReset={() => setLocal(serverValue)}
        />
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTabId>('general');
  const [updatedAtMap, setUpdatedAtMap] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useSettings({ limit: 100 });
  const { mutateAsync: saveSetting } = useUpdateSetting();

  const handleSave = async (field: SettingFieldConfig, value: unknown) => {
    setSavingKey(field.key);

    try {
      const updated = await saveSetting({ key: field.key, value });
      setUpdatedAtMap((prev) => ({ ...prev, [field.key]: updated.updatedAt }));
      toast.success('تنظیم ذخیره شد', {
        description: `«${field.label}» به‌روزرسانی شد`,
      });
    } catch (saveError) {
      toast.error('ذخیره‌ی تنظیم ناموفق بود', {
        description: getApiErrorMessage(saveError),
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات"
        description="پیکربندی پنل ادمین و امکانات پلتفرم"
      />

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>خطا در بارگذاری تنظیمات</CardTitle>
            <CardDescription>{getApiErrorMessage(error)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => refetch()}>
              تلاش دوباره
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as SettingsTabId)}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {SETTING_TABS.map((settingsTab) => (
              <TabsTrigger key={settingsTab.id} value={settingsTab.id}>
                {settingsTab.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {SETTING_TABS.map((settingsTab) => (
            <TabsContent key={settingsTab.id} value={settingsTab.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{settingsTab.title}</CardTitle>
                  <CardDescription>{settingsTab.description}</CardDescription>
                </CardHeader>
                <CardContent className="divide-y">
                  {settingsTab.fields.map((field) => (
                    <SettingField
                      key={field.key}
                      field={field}
                      stored={settings?.[field.key]}
                      updatedAt={updatedAtMap[field.key]}
                      isSaving={savingKey === field.key}
                      onSave={(value) => handleSave(field, value)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
