import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatCurrency } from '@yuma/persian';
import { CURRENCY } from '@yuma/config';
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from '@yuma/types';

/**
 * تبدیل مبلغ ذخیره‌شده (ریال) به نمایش تومانی.
 *
 * `Money.amount` در دیتابیس ریال است، ولی کاربر تومان می‌بیند.
 */
export function formatOrderTotal(order: Order): string {
  const rial = order.totalAmount.amount;
  const toman = order.totalAmount.currency === 'IRT' ? rial : rial / CURRENCY.RIAL_PER_TOMAN;
  return formatCurrency(Math.round(toman), 'toman');
}

/** قالب‌بندی تاریخ ثبت‌سفارش به شمسی */
export function formatOrderDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/** رنگ نشانگر بر اساس وضعیت سفارش */
const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700' },
  picked_up: { bg: 'bg-blue-100', text: 'text-blue-700' },
  at_laundry: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  quotation_sent: { bg: 'bg-purple-100', text: 'text-purple-700' },
  quotation_approved: { bg: 'bg-purple-100', text: 'text-purple-700' },
  washing: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  quality_check: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  ready: { bg: 'bg-teal-100', text: 'text-teal-700' },
  out_for_delivery: { bg: 'bg-teal-100', text: 'text-teal-700' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

/** نشانگر رنگی وضعیت سفارش */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
      <Text className={`text-xs font-bold ${colors.text}`}>
        {ORDER_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

/**
 * کارت خلاصه سفارش — با کلیک به صفحه جزئیات هدایت می‌شود.
 *
 * @example
 * <OrderCard order={order} />
 */
export default function OrderCard({ order }: { order: Order }) {
  const handlePress = () => {
    router.push({ pathname: '/orders/[id]', params: { id: order.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-slate-900">
          کد پیگیری: {order.trackingCode}
        </Text>
        <StatusBadge status={order.status} />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xs text-slate-500">تاریخ ثبت</Text>
          <Text className="mt-0.5 text-sm text-slate-700">
            {formatOrderDate(order.createdAt)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-slate-500">مبلغ کل</Text>
          <Text className="mt-0.5 text-sm font-bold text-slate-900">
            {formatOrderTotal(order)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
