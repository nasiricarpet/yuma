import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, formatJalaliDate, toPersianDigits } from '@yuma/persian';

interface Assignment {
  id: string;
  code: string;
  laundry: string;
  area: string;
  distanceKm: number;
  /** مبلغ قابل تسویه به ریال */
  payoutRial: number;
  windowStart: string;
  windowEnd: string;
}

const assignments: Assignment[] = [
  {
    id: 'a1',
    code: 'YM-1042',
    laundry: 'خشکشویی آذربایجان',
    area: 'ولیعصر، کوچه گلستان',
    distanceKm: 2.4,
    payoutRial: 120_000,
    windowStart: '2026-09-30T08:15:00Z',
    windowEnd: '2026-09-30T10:15:00Z',
  },
  {
    id: 'a2',
    code: 'YM-1043',
    laundry: 'خشکشویی آذربایجان',
    area: 'بلوار توانیر، پلاک ۱۸',
    distanceKm: 4.1,
    payoutRial: 165_000,
    windowStart: '2026-09-30T11:00:00Z',
    windowEnd: '2026-09-30T13:00:00Z',
  },
];

/** تبدیل ریال به تومان برای نمایش */
const toToman = (rial: number): number => Math.round(rial / 10);

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const today = formatJalaliDate(new Date(), 'dddd D MMMM YYYY');

  const totalPayout = assignments.reduce((sum, a) => sum + a.payoutRial, 0);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View className="rounded-b-3xl bg-brand px-6 pb-8 pt-6">
        <Text className="text-sm text-brand-light">{today}</Text>
        <Text className="mt-2 text-2xl font-bold text-white">
          {toPersianDigits(assignments.length)} مأموریت فعال
        </Text>
        <Text className="mt-3 text-base text-white">
          مجموع درآمد امروز: {formatCurrency(toToman(totalPayout), 'toman')}
        </Text>
      </View>

      <View className="px-6 pt-6">
        {assignments.map((assignment) => (
          <Link key={assignment.id} href={`/assignment/${assignment.id}`} asChild>
            <Pressable className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80">
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-slate-900">
                  {toPersianDigits(assignment.code)}
                </Text>
                <Text className="text-xs text-slate-500">
                  {toPersianDigits(assignment.distanceKm.toFixed(1))} کیلومتر
                </Text>
              </View>

              <Text className="mt-2 text-sm text-slate-600">{assignment.laundry}</Text>
              <Text className="mt-1 text-sm text-slate-500">{assignment.area}</Text>

              <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
                <Text className="text-xs text-slate-500">
                  بازه تحویل:{' '}
                  {formatJalaliDate(new Date(assignment.windowStart), 'HH:mm')} تا{' '}
                  {formatJalaliDate(new Date(assignment.windowEnd), 'HH:mm')}
                </Text>
                <Text className="font-bold text-brand">
                  {formatCurrency(toToman(assignment.payoutRial), 'toman')}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
