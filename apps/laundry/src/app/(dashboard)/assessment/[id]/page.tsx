'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssessmentItemCard } from '@/components/assessment/assessment-item-card';
import { AssessmentSidebar } from '@/components/assessment/assessment-sidebar';
import { getAssessment, saveAssessment } from '@/lib/api/endpoints/orders';
import { ApiError } from '@/lib/api/client';
import { buildMockAssessment } from '@/lib/api/mock';
import {
  calculateDiscountAmount,
  calculateItemPrice,
  calculateSubtotal,
  calculateTotal,
} from '@/lib/pricing';
import type { Assessment, AssessmentItem } from '@/lib/types';

/**
 * صفحه فرم ارزیابی یک سفارش.
 *
 * هر فرش در یک کارت مجزا بررسی می‌شود؛ قیمت هر قلم از قواعد قیمت‌گذاری
 * محاسبه می‌شود (قابل ویرایش دستی کارشناس). جمع کل و تخفیف در سایدبار
 * چسبان نمایش داده می‌شود.
 */
export default function AssessmentFormPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [manualPriceIds, setManualPriceIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAssessment(orderId);
      setAssessment(data);
    } catch {
      // API هنوز endpoint ارزیابی ندارد — داده نمونه برای پیش‌نمایش
      setAssessment(buildMockAssessment(orderId));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => assessment?.items ?? [], [assessment]);

  const totals = useMemo(() => {
    const subtotal = calculateSubtotal(items);
    const percent = assessment?.discountPercent ?? 0;
    const discountAmount = calculateDiscountAmount(subtotal, percent);
    return {
      subtotal,
      percent,
      discountAmount,
      total: calculateTotal(subtotal, discountAmount),
    };
  }, [items, assessment?.discountPercent]);

  const updateItem = useCallback(
    (itemId: string, patch: Partial<AssessmentItem>) => {
      setAssessment((current) => {
        if (!current) return current;

        const existing = current.items.find((item) => item.id === itemId);
        if (!existing) return current;

        const updated: AssessmentItem = { ...existing, ...patch };

        const pricingChanged = [
          'rugType',
          'areaSqm',
          'services',
          'damages',
          'stains',
        ].some((key) => key in patch);

        const isManual = manualPriceIds.has(itemId);
        if (pricingChanged && !isManual) {
          updated.price = calculateItemPrice(updated);
        }
        if ('price' in patch && !isManual) {
          setManualPriceIds((ids) => new Set(ids).add(itemId));
        }

        return {
          ...current,
          items: current.items.map((item) =>
            item.id === itemId ? updated : item,
          ),
        };
      });
    },
    [manualPriceIds],
  );

  const removeItem = useCallback((itemId: string) => {
    setAssessment((current) =>
      current
        ? { ...current, items: current.items.filter((i) => i.id !== itemId) }
        : current,
    );
  }, []);

  const addItem = useCallback(() => {
    setAssessment((current) => {
      if (!current) return current;
      const next: AssessmentItem = {
        id: `new-${Date.now()}`,
        rugType: 'machine',
        areaSqm: 3,
        services: ['wash'],
        damages: [],
        stains: [],
        price: 0,
        note: undefined,
      };
      return { ...current, items: [...current.items, next] };
    });
  }, []);

  const setDiscountPercent = useCallback((percent: number) => {
    setAssessment((current) =>
      current
        ? { ...current, discountPercent: Math.min(Math.max(percent, 0), 100) }
        : current,
    );
  }, []);

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!assessment) return;
    setSaving(true);
    setNotice(null);

    try {
      const saved = await saveAssessment(
        orderId,
        {
          items: assessment.items,
          discountPercent: totals.percent,
          discountAmount: totals.discountAmount,
          subtotal: totals.subtotal,
          total: totals.total,
        },
        status,
      );
      setAssessment(saved);
      setNotice(
        status === 'submitted'
          ? 'ارزیابی برای مشتری ارسال شد.'
          : 'پیش‌نویس ذخیره شد.',
      );
    } catch (cause) {
      // سرور در دسترس نیست — در حالت نمونه ذخیره محلی انجام می‌شود
      setAssessment((current) => (current ? { ...current, status } : current));
      setNotice(
        cause instanceof ApiError
          ? `ذخیره انجام نشد (${cause.message}) — تغییرات محلی نگه داشته شد.`
          : 'سرور در دسترس نیست — تغییرات محلی نگه داشته شد.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !assessment) {
    return (
      <main className="mx-auto flex max-w-6xl items-center justify-center px-6 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بارگذاری ارزیابی…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <Link
        href="/assessment"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به لیست ارزیابی
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-bold md:text-2xl">
            <span className="num">{assessment.trackingCode}</span>
            <Badge
              variant={assessment.status === 'submitted' ? 'success' : 'secondary'}
            >
              {assessment.status === 'submitted'
                ? 'ارسال شده به مشتری'
                : 'پیش‌نویس'}
            </Badge>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مشتری: <span className="font-medium text-foreground">{assessment.customerName}</span>
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {assessment.items.map((item, index) => (
            <AssessmentItemCard
              key={item.id}
              item={item}
              index={index + 1}
              priceManuallySet={manualPriceIds.has(item.id)}
              onChange={(patch) => updateItem(item.id, patch)}
              onRemove={() => removeItem(item.id)}
              canRemove={assessment.items.length > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addItem}
          >
            <Plus className="h-4 w-4" />
            افزودن فرش
          </Button>
        </div>

        <AssessmentSidebar
          subtotal={totals.subtotal}
          discountPercent={totals.percent}
          discountAmount={totals.discountAmount}
          total={totals.total}
          itemCount={assessment.items.length}
          saving={saving}
          notice={notice}
          onDiscountChange={setDiscountPercent}
          onSaveDraft={() => void handleSave('draft')}
          onSubmit={() => void handleSave('submitted')}
        />
      </div>
    </main>
  );
}
