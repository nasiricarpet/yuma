import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/auth-store';

/**
 * صفحه خانه مشتری — مقصد ریدایرکت پس از احراز هویت موفق.
 * ساخت تب‌ها و داشبورد کامل در فاز بعدی انجام می‌شود.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top + 32, paddingHorizontal: 24 }}
    >
      <Text className="text-2xl font-bold text-slate-900">یوما</Text>
      <Text className="mt-2 text-base text-slate-500">
        {user ? `خوش آمدی ${user.fullName}` : 'به داشبورد مشتری خوش آمدی'}
      </Text>

      <View className="mt-8">
        <Text className="text-sm text-slate-500" onPress={logout}>
          خروج از حساب
        </Text>
      </View>
    </View>
  );
}
