import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, toPersianDigits } from '@yuma/persian';
import { CURRENCY } from '@yuma/config';
import { useOrder } from '@/src/lib/api/queries/use-orders';
import {
  StatusBadge,
  formatOrderDate,
  formatOrderTotal,
} from '@/src/components/orders/order-card';

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="mt-3 text-sm text-slate-500">در حال بارگذاری جزئیات…</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="text-base font-bold text-slate-900">سفارش یافت نشد</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          دریافت جزئیات این سفارش ناموفق بود یا شناسه نامعتبر است.
        </Text>
      </View>
    );
  }

  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <ScrollView className="flex-1 bg-slate-50" keyboardShouldPersistTaps="handled">
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* خلاصه */}
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">کد پیگیری</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text className="mt-1 text-base font-bold text-brand-dark">
            {order.trackingCode}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            ثبت: {formatOrderDate(order.createdAt)}
          </Text>
        </View>

        {/* آدرس */}
        <Text className="mb-2 mt-6 text-base font-bold text-slate-900">آدرس</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-sm text-slate-700">
            {order.address.province}، {order.address.city}
          </Text>
          <Text className="mt-1 text-sm text-slate-700">{order.address.fullAddress}</Text>
          {order.address.postalCode ? (
            <Text className="mt-1 text-xs text-slate-500">
              کد پستی: {toPersianDigits(order.address.postalCode)}
            </Text>
          ) : null}
        </View>

        {/* اقلام */}
        <Text className="mb-2 mt-6 text-base font-bold text-slate-900">اقلام سفارش</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          {order.items.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between border-b border-slate-100 py-2.5"
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-slate-900">
                  {item.serviceName}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  {toPersianDigits(item.quantity)} عدد ×{' '}
                  {formatCurrency(item.unitPrice, 'toman')}
                </Text>
              </View>
              <Text className="text-sm font-bold text-slate-900">
                {formatCurrency(item.unitPrice * item.quantity, 'toman')}
              </Text>
            </View>
          ))}
        </View>

        {/* مبالغ تفکیک‌شده */}
        <Text className="mb-2 mt-6 text-base font-bold text-slate-900">مبالغ</Text>
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-center justify-between py-1.5">
            <Text className="text-sm text-slate-600">جمع اقلام</Text>
            <Text className="text-sm text-slate-900">
              {formatCurrency(itemsTotal, 'toman')}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-3">
            <Text className="text-base font-bold text-slate-900">مبلغ کل</Text>
            <Text className="text-base font-bold text-brand-dark">
              {formatOrderTotal(order)}
            </Text>
          </View>
          <Text className="mt-1 text-left text-[10px] text-slate-400">
            واحد ذخیره‌سازی: {order.totalAmount.currency} ({CURRENCY.display} نمایش)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
