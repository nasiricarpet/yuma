'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatToman, toFa } from '@/lib/utils/format';

/**
 * سایدبار چسبانِ فرم ارزیابی — جمع اقلام، تخفیف، مبلغ نهایی
 * و دکمه‌های ذخیره پیش‌نویس / ارسال به مشتری.
 */
export interface AssessmentSidebarProps {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  saving: boolean;
  notice: string | null;
  onDiscountChange: (percent: number) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function AssessmentSidebar({
  subtotal,
  discountPercent,
  discountAmount,
  total,
  itemCount,
  saving,
  notice,
  onDiscountChange,
  onSaveDraft,
  onSubmit,
}: AssessmentSidebarProps) {
  return (
    <div className="lg:sticky lg:top-6 lg:h-fit">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">خلاصه قیمت‌گذاری</CardTitle>
          <p className="text-xs text-muted-foreground">
            {toFa(itemCount)} قلم ارزیابی شده
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">جمع اقلام</span>
            <span className="num font-medium">{formatToman(subtotal)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-percent">تخفیف (٪)</Label>
            <Input
              id="discount-percent"
              type="number"
              min={0}
              max={100}
              value={discountPercent || ''}
              onChange={(event) =>
                onDiscountChange(Number(event.target.value))
              }
              placeholder="۰"
              className="num"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">مبلغ تخفیف</span>
            <span className="num font-medium text-destructive">
              {discountAmount > 0 ? `− ${formatToman(discountAmount)}` : '۰ تومان'}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium">مبلغ نهایی</span>
            <span className="num text-lg font-bold text-primary">
              {formatToman(total)}
            </span>
          </div>

          {notice ? (
            <div className="flex items-start gap-2 rounded-md bg-accent p-3 text-xs text-accent-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </div>
          ) : null}

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              className="w-full"
              disabled={saving || itemCount === 0}
              onClick={onSubmit}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ارسال به مشتری
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={saving}
              onClick={onSaveDraft}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ذخیره پیش‌نویس
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
