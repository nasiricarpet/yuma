/**
 * تقویم جلالی (date picker) — React
 * شبکه ۷ ستونه: ش = شنبه ... ج = جمعه
 */
import { useMemo, useState } from 'react';
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_SHORT,
  formatJalaliDate,
  jalaliMonthLength,
  toGregorian,
  toJalali,
  type JalaliDate,
} from '@yuma/persian';

export interface JalaliDatePickerProps {
  /** تاریخ انتخاب‌شده (کنترل‌شده) */
  value?: JalaliDate;
  onChange?: (date: JalaliDate) => void;
  /** تاریخ اولیه در حالت غیرکنترل‌شده */
  defaultValue?: JalaliDate;
}

export function JalaliDatePicker({ value, onChange, defaultValue }: JalaliDatePickerProps) {
  const today = useMemo(() => toJalali(new Date()), []);
  const [view, setView] = useState<JalaliDate>(value ?? defaultValue ?? today);
  const selected = value ?? null;

  const monthLength = jalaliMonthLength(view.jy, view.jm);
  // روز هفته اول ماه: شنبه = ستون ۰
  const firstWeekday = ((jalaliMonthFirstJdn(view) + 2) % 7 + 7) % 7;

  const cells: (JalaliDate | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: monthLength }, (_, i) => ({
      jy: view.jy,
      jm: view.jm,
      jd: i + 1,
    })),
  ];

  const prevMonth = () => {
    setView(({ jy, jm }) =>
      jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 },
    );
  };
  const nextMonth = () => {
    setView(({ jy, jm }) =>
      jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 },
    );
  };

  const goToday = () => setView(today);

  return (
    <div dir="rtl" className="inline-block rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          aria-label="ماه قبل"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          ›
        </button>
        <div className="font-semibold">
          {JALALI_MONTH_NAMES[view.jm - 1]} {formatJalaliDate({ jy: view.jy, jm: 1, jd: 1 }, 'YYYY')}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="ماه بعد"
          className="rounded px-2 py-1 hover:bg-gray-100"
        >
          ‹
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {JALALI_WEEKDAY_SHORT.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e-${i}`} />;
          const isToday = cell.jy === today.jy && cell.jm === today.jm && cell.jd === today.jd;
          const isSelected =
            selected && cell.jy === selected.jy && cell.jm === selected.jm && cell.jd === selected.jd;
          return (
            <button
              key={`${cell.jy}-${cell.jm}-${cell.jd}`}
              type="button"
              onClick={() => onChange?.(cell)}
              className={[
                'rounded-lg py-1.5 text-sm transition-colors',
                isSelected
                  ? 'bg-teal-700 text-white'
                  : isToday
                    ? 'border border-teal-600 text-teal-800'
                    : 'hover:bg-gray-100',
              ].join(' ')}
            >
              {cell.jd}
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <button type="button" onClick={goToday} className="text-xs text-teal-700 underline">
          امروز
        </button>
      </div>
    </div>
  );
}

/** JDN روز اول ماه view (برای محاسبه weekday) */
function jalaliMonthFirstJdn(j: JalaliDate): number {
  const g = toGregorian(j.jy, j.jm, 1);
  return Math.floor(g.getTime() / 86400000) + 2440588;
}
