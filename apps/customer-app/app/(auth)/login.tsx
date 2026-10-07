import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toPersianDigits } from '@yuma/persian';
import { mobileSchema } from '@yuma/validators';
import { requestOtp } from '@/src/lib/api/auth';

/** تبدیل ارقام فارسی/عربی به لاتین برای پردازش ورودی کاربر */
function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleMobileChange = (value: string) => {
    setMobile(normalizeDigits(value));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    // نرمال‌سازی و اعتبارسنجی شماره موبایل
    const normalized = normalizeDigits(mobile);
    const result = mobileSchema.safeParse(normalized);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'شماره موبایل نامعتبر است');
      return;
    }

    const validatedMobile = result.data;

    try {
      setSubmitting(true);
      // در حالت واقعی کد پیامک می‌شود — خطا را نادیده می‌گیریم تا دمو کار کند
      await requestOtp(validatedMobile);
    } catch {
      // endpoint هنوز پیاده نشده؛ ادامه می‌دهیم تا فلو کامل دیده شود
    } finally {
      setSubmitting(false);
    }

    // هدایت به صفحه تأیید کد همراه با شماره موبایل
    router.push({ pathname: '/otp', params: { mobile: validatedMobile } });
  };

  return (
    <View
      className="flex-1 bg-slate-50"
      style={{ paddingTop: insets.top + 32, paddingHorizontal: 24 }}
    >
      <View className="mb-10">
        <Text className="text-3xl font-bold text-slate-900">یوما</Text>
        <Text className="mt-2 text-base text-slate-500">
          برای ورود شماره موبایل خود را وارد کنید
        </Text>
      </View>

      <Text className="mb-2 text-sm font-bold text-slate-900">شماره موبایل</Text>
      <TextInput
        value={mobile}
        onChangeText={handleMobileChange}
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        placeholderTextColor="#94a3b8"
        keyboardType="phone-pad"
        inputMode="tel"
        maxLength={11}
        textAlign="right"
        className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-right text-lg"
      />
      <Text className="mt-2 text-xs text-slate-500">
        {toPersianDigits('09xxxxxxxxx')} — کد تأیید برای این شماره پیامک می‌شود
      </Text>

      {error ? (
        <Text className="mt-2 text-xs text-red-600">{error}</Text>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={submitting}
        className="mt-8 flex-row items-center justify-center rounded-2xl bg-brand py-4 active:opacity-80"
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-bold text-white">ارسال کد تأیید</Text>
        )}
      </Pressable>

      <View className="h-8" />
    </View>
  );
}
