import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { JalaliCalendar } from '@yuma/ui/native';
import { toJalali, toPersianDigits, formatJalaliDate, type JalaliDate } from '@yuma/persian';
import { mobileSchema, persianNameSchema } from '@yuma/validators';

/** تبدیل ارقام فارسی/عربی به لاتین برای پردازش ورودی کاربر */
function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export default function NewOrderScreen() {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickupDate, setPickupDate] = useState<JalaliDate>(() => toJalali(new Date()));

  const submit = () => {
    const nextErrors: Record<string, string> = {};

    const nameResult = persianNameSchema.safeParse(fullName);
    if (!nameResult.success) {
      nextErrors.fullName = nameResult.error.issues[0]?.message ?? 'نام نامعتبر است';
    }

    const mobileResult = mobileSchema.safeParse(mobile);
    if (!mobileResult.success) {
      nextErrors.mobile = mobileResult.error.issues[0]?.message ?? 'شماره موبایل نامعتبر است';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const when = formatJalaliDate(pickupDate, 'dddd D MMMM YYYY');
    Alert.alert(
      'سفارش ثبت شد',
      `درخواست شما برای ${when} ثبت شد و در انتظار تأیید خشکشویی است.`,
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
      <Text className="mb-2 text-sm font-bold text-slate-900">نام و نام خانوادگی</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="مثال: زهرا محمدی"
        textAlign="right"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right"
      />
      {errors.fullName ? (
        <Text className="mt-2 text-xs text-red-600">{errors.fullName}</Text>
      ) : null}

      <Text className="mb-2 mt-6 text-sm font-bold text-slate-900">شماره موبایل</Text>
      <TextInput
        value={mobile}
        onChangeText={(value) => setMobile(normalizeDigits(value))}
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        keyboardType="phone-pad"
        inputMode="tel"
        textAlign="right"
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right"
      />
      {errors.mobile ? (
        <Text className="mt-2 text-xs text-red-600">{errors.mobile}</Text>
      ) : (
        <Text className="mt-2 text-xs text-slate-500">
          {toPersianDigits('09xxxxxxxxx')} — پیامک تأیید برای این شماره ارسال می‌شود
        </Text>
      )}


      <Text className="mb-2 mt-6 text-sm font-bold text-slate-900">تاریخ تحویل</Text>
      <JalaliCalendar value={pickupDate} onChange={setPickupDate} />

      <Pressable
        onPress={submit}
        className="mt-8 items-center rounded-2xl bg-brand py-4 active:opacity-80"
      >
        <Text className="text-base font-bold text-white">ثبت سفارش</Text>
      </Pressable>

      <View className="h-6" />
    </ScrollView>
  );
}
