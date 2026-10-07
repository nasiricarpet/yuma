'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, CalendarIcon } from 'lucide-react';
import { toJalaali, toGregorian } from 'jalaali-js';
import {
  JALALI_WEEKDAY_SHORT,
  getJalaliMonthName,
  toPersianDigits,
} from '@yuma/persian';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils/cn';

export type PersianDatePickerProps = {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/** اندیس روز هفته میلادی (۰=یکشنبه … ۶=شنبه) → اندیس شمسی (۰=شنبه … ۶=جمعه) */
function toJalaliWeekday(jsDay: number): number {
  return (jsDay + 1) % 7;
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled,
  className,
}: PersianDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedJalali = useMemo(
    () => (value ? toJalaali(value) : null),
    [value],
  );

  const [view, setView] = useState(() => ({
    jy: selectedJalali?.jy ?? 1403,
    jm: selectedJalali?.jm ?? 1,
  }));

  const goPrevMonth = useCallback(() => {
    setView((v) => {
      const jm = v.jm - 1;
      return jm < 1 ? { jy: v.jy - 1, jm: 12 } : { jy: v.jy, jm };
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setView((v) => {
      const jm = v.jm + 1;
      return jm > 12 ? { jy: v.jy + 1, jm: 1 } : { jy: v.jy, jm };
    });
  }, []);

  const days = useMemo(() => {
    // طول ماه جلالی: با تلاش روز ۳۱ام تشخیص می‌دهیم
    const monthLength = (() => {
      if (view.jm <= 6) return 31;
      if (view.jm <= 11) return 30;
      // اسفند: کبیسه را با روز سی‌ام می‌سنجیم
      const lastOfEsfand = toGregorian(view.jy, 12, 30);
      const esfandLastDay = toJalaali(
        lastOfEsfand.gy,
        lastOfEsfand.gm,
        lastOfEsfand.gd,
      );
      return esfandLastDay.jd === 30 ? 30 : 29;
    })();

    const firstGregorian = toGregorian(view.jy, view.jm, 1);
    const firstJsDay = new Date(
      firstGregorian.gy,
      firstGregorian.gm - 1,
      firstGregorian.gd,
    ).getDay();

    const cells: (number | null)[] = [];
    const leadingBlanks = toJalaliWeekday(firstJsDay);
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let d = 1; d <= monthLength; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [view]);

  const display = useMemo(() => {
    if (!selectedJalali) return '';
    const { jy, jm, jd } = selectedJalali;
    const two = (n: number) => String(n).padStart(2, '0');
    return toPersianDigits(`${jy}/${two(jm)}/${two(jd)}`);
  }, [selectedJalali]);

  const handleSelect = (day: number) => {
    const g = toGregorian(view.jy, view.jm, day);
    onChange?.(new Date(g.gy, g.gm - 1, g.gd));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            readOnly
            value={display}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('cursor-pointer pr-9', className)}
          />
          <CalendarIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goPrevMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {getJalaliMonthName(view.jm)} {toPersianDigits(view.jy)}
          </span>
          <Button variant="ghost" size="icon" onClick={goNextMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1" role="grid">
          {JALALI_WEEKDAY_SHORT.map((day) => (
            <span
              key={day}
              className="flex h-7 items-center justify-center text-xs text-muted-foreground"
              role="columnheader"
            >
              {day}
            </span>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return <span key={`blank-${index}`} role="gridcell" />;
            }

            const isSelected =
              selectedJalali?.jy === view.jy &&
              selectedJalali?.jm === view.jm &&
              selectedJalali?.jd === day;

            return (
              <button
                key={`day-${day}`}
                type="button"
                role="gridcell"
                onClick={() => handleSelect(day)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                  isSelected
                    ? 'bg-yuma-600 text-white'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {toPersianDigits(day)}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
