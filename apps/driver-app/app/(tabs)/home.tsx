import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/auth-store';
import { useMyAssignments } from '@/src/lib/api/queries/use-assignments';
import AssignmentCard from '@/src/components/assignments/assignment-card';
import type { Assignment } from '@/src/lib/api/endpoints/assignments';
import { toPersianDigits } from '@yuma/persian';

/** آیتم جداکننده بین کارت‌ها */
function ItemSeparator() {
  return <View className="h-3" />;
}

/**
 * تب اصلی خانه سفیر — لیست وظایف محول‌شده با Pull-to-refresh.
 * مقصد ریدایرکت پس از احراز هویت موفق.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const driver = useAuthStore((state) => state.driver);
  const { data: assignments, isLoading, refetch, isRefetching } = useMyAssignments();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text className="mt-3 text-sm text-slate-500">در حال بارگذاری وظایف…</Text>
      </View>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-slate-50 px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg font-bold text-slate-900">وظیفه‌ای موجود نیست</Text>
        <Text className="mt-2 text-center text-sm text-slate-500">
          {driver
            ? `سفیر عزیز، در حال حاضر وظیفه‌ای به شما محول نشده است.`
            : 'ابتدا وارد حساب کاربری خود شوید.'}
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-4 rounded-xl bg-brand px-6 py-3 active:opacity-80"
        >
          <Text className="text-sm font-bold text-white">بررسی مجدد</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList<Assignment>
      data={assignments}
      keyExtractor={(item: Assignment) => item.id}
      renderItem={({ item }: { item: Assignment }) => (
        <AssignmentCard assignment={item} />
      )}
      ItemSeparatorComponent={ItemSeparator}
      onRefresh={refetch}
      refreshing={isRefetching}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
      }}
      className="flex-1 bg-slate-50"
    />
  );
}
