import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toPersianDigits } from '@yuma/persian';
import { useAuthStore } from '@/src/store/auth-store';
import { verifyOtp } from '@/src/lib/api/auth';

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const login = useAuthStore((state) => state.login);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mobileDisplay = mobile ? toPersianDigits(mobile) : '';

  const handleSubmit = async () => {
    if (!mobile) {
      Alert.alert('خطا', 'شماره موبایل یافت نشد. دوباره تلاش کنید.');
      return;
    }

    if (!/^\d{5,6}$/.test(code)) {
      Alert.alert('کد نامعتبر', 'کد تأیید باید ۵ یا ۶ رقم باشد.');
      return;
    }

    try {
      setSubmitting(true);
      // سابمیت موفق → توکن در Zustand ذخیره و ریدایرکت به داشبورد
      const { token, user } = await verifyOtp(mobile, code);
      login({ user, token });
      router.replace('/home');
    } catch {
      Alert.alert(
        'خطا در تأیید کد',
        'کد تأیید اشتباه است یا منقضی شده است. دوباره تلاش کنید.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top + 32, paddingHorizontal: 24 }}
    >
      <View className="mb-10">
        <Text className="text-3xl font-bold text-slate-900">تأیید کد</Text>
        <Text className="mt-2 text-base text-slate-500">
          کد تأیید ارسال‌شده به {mobileDisplay} را وارد کنید
        </Text>
      </View>

      <Text className="mb-2 text-sm font-bold text-slate-900">کد تأیید</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="۱۲۳۴۵۶"
        placeholderTextColor="#94a3b8"
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={6}
        textAlign="center"
        className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl tracking-[8px]"
      />

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="mt-8 flex-row items-center justify-center rounded-2xl bg-brand py-4 active:opacity-80"
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-bold text-white">ورود</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        className="mt-4 items-center py-2 active:opacity-70"
      >
        <Text className="text-sm font-medium text-brand-dark">
          تغییر شماره موبایل
        </Text>
      </Pressable>

      <View className="h-8" />
    </View>
  );
}
