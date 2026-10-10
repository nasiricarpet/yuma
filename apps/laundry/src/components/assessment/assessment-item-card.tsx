'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toFa } from '@/lib/utils/format';
import {
  DAMAGE_TYPE_LABELS,
  RUG_SERVICE_LABELS,
  RUG_TYPE_LABELS,
  STAIN_SEVERITY_LABELS,
  STAIN_TYPE_LABELS,
  type AssessmentDamage,
  type AssessmentItem,
  type AssessmentStain,
  type DamageType,
  type RugService,
  type RugType,
  type StainSeverity,
  type StainType,
} from '@/lib/types';

/**
 * کارت ارزیابی یک فرش — همه فیلدهای یک قلم سفارش:
 * نوع، متراژ، آسیب، لکه، سرویس‌ها، قیمت و یادداشت داخلی.
 *
 * قیمت به‌صورت خودکار از قواعد قیمت‌گذاری محاسبه می‌شود اما
 * کارشناس می‌تواند آن را دستی ویرایش کند.
 */
export interface AssessmentItemCardProps {
  item: AssessmentItem;
  /** شماره این فرش در سفارش — برای عنوان کارت */
  index: number;
  /** آیا قیمت این قلم دستی ویرایش شده؟ */
  priceManuallySet: boolean;
  onChange: (patch: Partial<AssessmentItem>) => void;
  onRemove: () => void;
  /** آیا این تنها قلم است؟ حذف قلم تنها مجاز نیست */
  canRemove: boolean;
}

const SERVICES = Object.keys(RUG_SERVICE_LABELS) as RugService[];
const RUG_TYPES = Object.keys(RUG_TYPE_LABELS) as RugType[];
const DAMAGE_TYPES = Object.keys(DAMAGE_TYPE_LABELS) as DamageType[];
const STAIN_TYPES = Object.keys(STAIN_TYPE_LABELS) as StainType[];

export function AssessmentItemCard({
  item,
  index,
  priceManuallySet,
  onChange,
  onRemove,
  canRemove,
}: AssessmentItemCardProps) {
  const priceToman = Math.round(item.price / 10);

  const toggleService = (service: RugService, checked: boolean) => {
    const services = checked
      ? [...item.services, service]
      : item.services.filter((existing) => existing !== service);
    onChange({ services });
  };

  const hasDamage = item.damages.length > 0;
  const hasStain = item.stains.length > 0;

  const currentDamage: AssessmentDamage = item.damages[0] ?? { type: 'tear' };
  const currentStain: AssessmentStain = item.stains[0] ?? {
    type: 'oil',
    severity: 2,
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span>فرش</span>
            <span className="num text-primary">{toFa(index)}</span>
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            قیمت این قلم:{' '}
            <span className="num font-medium text-foreground">
              {toFa(priceToman.toLocaleString('en-US'))} تومان
            </span>
          </p>
        </div>

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
            حذف
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* نوع فرش و متراژ */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`rug-type-${item.id}`}>نوع فرش</Label>
            <Select
              value={item.rugType}
              onValueChange={(value) => onChange({ rugType: value as RugType })}
            >
              <SelectTrigger id={`rug-type-${item.id}`}>
                <SelectValue placeholder="نوع فرش را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {RUG_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {RUG_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`area-${item.id}`}>متراژ (متر مربع)</Label>
            <Input
              id={`area-${item.id}`}
              type="number"
              min={0}
              step={0.5}
              value={item.areaSqm || ''}
              onChange={(event) =>
                onChange({ areaSqm: Number(event.target.value) })
              }
              placeholder="۶"
              className="num"
            />
          </div>
        </div>

        <Separator />

        {/* سرویس‌ها */}
        <div className="space-y-3">
          <Label>سرویس‌ها</Label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {SERVICES.map((service) => (
              <label
                key={service}
                htmlFor={`service-${item.id}-${service}`}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  id={`service-${item.id}-${service}`}
                  checked={item.services.includes(service)}
                  onCheckedChange={(checked) =>
                    toggleService(service, checked === true)
                  }
                />
                {RUG_SERVICE_LABELS[service]}
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* آسیب */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`damage-switch-${item.id}`}>آسیب دارد</Label>
            <Switch
              id={`damage-switch-${item.id}`}
              checked={hasDamage}
              onCheckedChange={(checked) =>
                onChange({ damages: checked ? [currentDamage] : [] })
              }
            />
          </div>

          {hasDamage ? (
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`damage-type-${item.id}`}>نوع آسیب</Label>
                <Select
                  value={currentDamage.type}
                  onValueChange={(value) =>
                    onChange({
                      damages: [{ ...currentDamage, type: value as DamageType }],
                    })
                  }
                >
                  <SelectTrigger id={`damage-type-${item.id}`}>
                    <SelectValue placeholder="نوع آسیب" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DAMAGE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:row-span-2">
                <Label htmlFor={`damage-note-${item.id}`}>توضیح آسیب</Label>
                <Textarea
                  id={`damage-note-${item.id}`}
                  rows={3}
                  value={currentDamage.description ?? ''}
                  onChange={(event) =>
                    onChange({
                      damages: [
                        {
                          ...currentDamage,
                          description: event.target.value || undefined,
                        },
                      ],
                    })
                  }
                  placeholder="مکان و میزان آسیب را شرح دهید…"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* لکه */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`stain-switch-${item.id}`}>لکه دارد</Label>
            <Switch
              id={`stain-switch-${item.id}`}
              checked={hasStain}
              onCheckedChange={(checked) =>
                onChange({ stains: checked ? [currentStain] : [] })
              }
            />
          </div>

          {hasStain ? (
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`stain-type-${item.id}`}>نوع لکه</Label>
                <Select
                  value={currentStain.type}
                  onValueChange={(value) =>
                    onChange({
                      stains: [{ ...currentStain, type: value as StainType }],
                    })
                  }
                >
                  <SelectTrigger id={`stain-type-${item.id}`}>
                    <SelectValue placeholder="نوع لکه" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAIN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {STAIN_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>شدت لکه</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Slider
                    value={[currentStain.severity]}
                    min={1}
                    max={3}
                    step={1}
                    onValueChange={(values) =>
                      onChange({
                        stains: [
                          {
                            ...currentStain,
                            severity: (values[0] ?? 2) as StainSeverity,
                          },
                        ],
                      })
                    }
                    aria-label="شدت لکه"
                  />
                  <span className="num w-16 shrink-0 text-sm font-medium">
                    {STAIN_SEVERITY_LABELS[currentStain.severity]}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <Separator />

        {/* قیمت و یادداشت */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`price-${item.id}`}>قیمت این قلم (تومان)</Label>
            <Input
              id={`price-${item.id}`}
              type="number"
              min={0}
              step={1000}
              value={priceToman || ''}
              onChange={(event) =>
                onChange({ price: Number(event.target.value) * 10 })
              }
              className="num"
            />
            <p className="text-xs text-muted-foreground">
              {priceManuallySet
                ? 'قیمت دستی ویرایش شده — خودکار غیرفعال شد'
                : 'از قواعد قیمت‌گذاری محاسبه می‌شود'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`}>یادداشت داخلی</Label>
            <Textarea
              id={`note-${item.id}`}
              rows={2}
              value={item.note ?? ''}
              onChange={(event) =>
                onChange({ note: event.target.value || undefined })
              }
              placeholder="فقط برای قالیشویی — برای مشتری ارسال نمی‌شود"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
