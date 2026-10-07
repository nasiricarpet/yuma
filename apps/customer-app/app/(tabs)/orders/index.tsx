import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMyOrders } from '@/src/lib/api/queries/use-orders';
import OrderCard from '@/src/components/orders/order-card';
import type { Order } from '@yuma/types';

/** آیتم جداکننده بین کارت‌ها */
function ItemSeparator() {
  return <View className="h-1" />;
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data: orders, isLoading, isError, refetch, isRefetching } = useMyOrders();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className="mt-3 text-sm text-slate-500">در حال بارگذاری سفارشات…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="text-base font-bold text-slate-900">خطا در بارگذاری</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          دریافت لیست سفارشات ناموفق بود.
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-4 rounded-xl bg-brand px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">تلاش مجدد</Text>
        </Pressable>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="text-lg font-bold text-slate-900">سفارشی ثبت نشده</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          هنوز سفارشی ندارید. از صفحه ثبت سفارش شروع کنید.
        </Text>
        <Pressable
          onPress={() => router.push('/new-order')}
          className="mt-4 rounded-xl bg-brand px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">ثبت سفارش جدید</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList<Order>
      data={orders}
      keyExtractor={(item: Order) => item.id}
      renderItem={({ item }: { item: Order }) => <OrderCard order={item} />}
      ItemSeparatorComponent={ItemSeparator}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: 24,
      }}
      className="flex-1 bg-slate-50"
    />
  );
}
