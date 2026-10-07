import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, formatJalaliDate, toPersianDigits } from '@yuma/persian';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@yuma/types';

interface CustomerOrder {
  code: string;
  status: OrderStatus;
  /** مبلغ به ریال (واحد ذخیره‌سازی) */
  amountRial: number;
  createdAt: string;
}

const orders: CustomerOrder[] = [
  {
    code: 'YM-1042',
    status: 'washing',
    amountRial: 480_000,
    createdAt: '2026-09-30T08:15:00Z',
  },
  {
    code: 'YM-0987',
    status: 'delivered',
    amountRial: 300_000,
    createdAt: '2026-09-24T11:00:00Z',
  },
];

const toToman = (rial: number): number => Math.round(rial / 10);

const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  washing: 'bg-blue-100 text-blue-800',
  ready: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-slate-200 text-slate-700',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const today = formatJalaliDate(new Date(), 'dddd D MMMM YYYY');

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View className="rounded-b-3xl bg-brand px-6 pb-8 pt-6">
        <Text className="text-2xl font-bold text-white">سلام 👋</Text>
        <Text className="mt-1 text-sm text-brand-light">{today}</Text>
        <Text className="mt-4 text-base text-white">
          سفارش خشکشویی‌ات را در چند ثانیه ثبت کن
        </Text>
      </View>

      <View className="px-6 pt-6">
        <Text className="mb-3 text-base font-bold text-slate-900">سفارش‌های فعال</Text>

        {orders.length === 0 ? (
          <Text className="py-8 text-center text-slate-500">هنوز سفارشی نداری</Text>
        ) : (
          orders.map((order) => (
            <View
              key={order.code}
              className="mb-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-slate-900">
                  {toPersianDigits(order.code)}
                </Text>
                <Text
                  className={`rounded-full px-3 py-1 text-xs ${
                    statusColor[order.status] ?? 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </Text>
              </View>

              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm text-slate-500">
                  {formatJalaliDate(new Date(order.createdAt), 'YYYY/MM/DD')}
                </Text>
                <Text className="font-bold text-slate-900">
                  {formatCurrency(toToman(order.amountRial), 'toman')}
                </Text>
              </View>
            </View>
          ))
        )}

        <Link href="/new-order" asChild>
          <Pressable className="mt-4 items-center rounded-2xl bg-brand py-4 active:opacity-80">
            <Text className="text-base font-bold text-white">ثبت سفارش جدید</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}
