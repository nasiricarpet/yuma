/**
 * تقویم جلالی برای React Native — شبکه ۷ ستونه RTL (ش = شنبه … ج = جمعه)
 * بدون هیچ وابستگی بیرونی؛ محاسبات از @yuma/persian می‌آید.
 */
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_SHORT,
  jalaliMonthLength,
  toGregorian,
  toJalali,
  type JalaliDate,
} from '@yuma/persian';

export interface JalaliCalendarProps {
  value?: JalaliDate;
  onChange?: (date: JalaliDate) => void;
  /** رنگ اصلی تقویم */
  accentColor?: string;
}

/** JDN روز اول ماه (برای تعیین ستون شروع) */
function monthFirstJdn(jy: number, jm: number): number {
  const g = toGregorian(jy, jm, 1);
  return Math.floor(g.getTime() / 86400000) + 2440588;
}

export function JalaliCalendar({ value, onChange, accentColor = '#0f766e' }: JalaliCalendarProps) {
  const today = useMemo(() => toJalali(new Date()), []);
  const [view, setView] = useState<JalaliDate>(value ?? today);

  const monthLength = jalaliMonthLength(view.jy, view.jm);
  const firstWeekday = (((monthFirstJdn(view.jy, view.jm) + 2) % 7) + 7) % 7;

  const cells: (JalaliDate | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null as JalaliDate | null),
    ...Array.from({ length: monthLength }, (_, i) => ({
      jy: view.jy,
      jm: view.jm,
      jd: i + 1,
    })),
  ];

  const shift = (delta: number) => {
    setView(({ jy, jm }) => {
      let m = jm + delta;
      let y = jy;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      return { jy: y, jm: m, jd: 1 };
    });
  };

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => shift(-1)}
          accessibilityLabel="ماه قبل"
          className="rounded-lg px-3 py-1 active:bg-slate-100"
        >
          <Text className="text-lg text-slate-600">›</Text>
        </Pressable>

        <Text className="font-bold text-slate-900">
          {JALALI_MONTH_NAMES[view.jm - 1]} {view.jy}
        </Text>

        <Pressable
          onPress={() => shift(1)}
          accessibilityLabel="ماه بعد"
          className="rounded-lg px-3 py-1 active:bg-slate-100"
        >
          <Text className="text-lg text-slate-600">‹</Text>
        </Pressable>
      </View>

      <View className="flex-row">
        {JALALI_WEEKDAY_SHORT.map((day) => (
          <View key={day} className="flex-1 items-center py-1">
            <Text className="text-xs text-slate-500">{day}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((cell, index) => {
          if (!cell) {
            return <View key={`empty-${index}`} className="w-[14.28%] py-2" />;
          }

          const isToday =
            cell.jy === today.jy && cell.jm === today.jm && cell.jd === today.jd;
          const isSelected =
            value && cell.jy === value.jy && cell.jm === value.jm && cell.jd === value.jd;

          return (
            <View key={`${cell.jy}-${cell.jm}-${cell.jd}`} className="w-[14.28%] py-1 px-0.5">
              <Pressable
                onPress={() => {
                  setView(cell);
                  onChange?.(cell);
                }}
                className="items-center rounded-lg py-2 active:bg-slate-100"
                style={
                  isSelected
                    ? { backgroundColor: accentColor }
                    : isToday
                      ? { borderWidth: 1, borderColor: accentColor }
                      : undefined
                }
              >
                <Text
                  className={isSelected ? 'text-white' : isToday ? '' : 'text-slate-800'}
                  style={isToday && !isSelected ? { color: accentColor } : undefined}
                >
                  {cell.jd}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => {
          setView(today);
          onChange?.(today);
        }}
        className="mt-3 items-center"
      >
        <Text className="text-xs" style={{ color: accentColor }}>
          امروز
        </Text>
      </Pressable>
    </View>
  );
}
