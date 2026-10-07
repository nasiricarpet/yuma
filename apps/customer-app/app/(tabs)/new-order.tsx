import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, toEnglishDigits, toPersianDigits } from '@yuma/persian';
import { useAuthStore } from '@/src/store/auth-store';
import {
  selectTotalItems,
  selectTotalPrice,
  useOrderStore,
} from '@/src/store/order-store';
import { submitOrder } from '@/src/lib/api/endpoints/orders';
import { DEFAULT_LAUNDRY_ID } from '@/src/lib/api/config';
import ServiceSelector from '@/src/components/orders/service-selector';

/** تبدیل ارقام فارسی/عربی ورودی کاربر به لاتین */
function normalizeDigits(value: string): string {
  return toEnglishDigits(value);
}

export default function NewOrderScreen() {
  const insets = useSafeAreaInsets();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const items = useOrderStore((state) => state.items);
  const totalItems = useOrderStore(selectTotalItems);
  const totalPrice = useOrderStore(selectTotalPrice);
  const province = useOrderStore((state) => state.province);
  const city = useOrderStore((state) => state.city);
  const address = useOrderStore((state) => state.address);
  const postalCode = useOrderStore((state) => state.postalCode);
  const phone = useOrderStore((state) => state.phone);
  const notes = useOrderStore((state) => state.notes);
  const setProvince = useOrderStore((state) => state.setProvince);
  const setCity = useOrderStore((state) => state.setCity);
  const setAddress = useOrderStore((state) => state.setAddress);
  const setPostalCode = useOrderStore((state) => state.setPostalCode);
  const setPhone = useOrderStore((state) => state.setPhone);
  const setNotes = useOrderStore((state) => state.setNotes);
  const clearOrder = useOrderStore((state) => state.clearOrder);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert('سرویس انتخاب نشده', 'حداقل یک سرویس باید انتخاب کنید.');
      return;
    }
    if (!province.trim() || !city.trim() || !address.trim()) {
      Alert.alert('آدرس ناقص', 'استان، شهر و آدرس کامل الزامی هستند.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('تلفن الزامی', 'شماره تلفن برای هماهنگی برداشت الزامی است.');
      return;
    }
    if (!token || !user?.id) {
      Alert.alert('ورود نشده', 'ابتدا وارد حساب خود شوید.');
      return;
    }
    if (!DEFAULT_LAUNDRY_ID) {
      Alert.alert(
        'تنظیمات ناقص',
        'قالیشویی پیش‌فرض در متغیر محیطی EXPO_PUBLIC_DEFAULT_LAUNDRY_ID تنظیم نشده است.',
      );
      return;
    }

    const normalizedPostalCode = normalizeDigits(postalCode).trim();
    if (postalCode.trim() && !/^\d{10}$/.test(normalizedPostalCode)) {
      Alert.alert('کد پستی نامعتبر', 'کد پستی باید ۱۰ رقم باشد.');
      return;
    }

    try {
      setSubmitting(true);
      const { order } = await submitOrder({
        customerId: user.id,
        laundryId: DEFAULT_LAUNDRY_ID,
        description: notes.trim() || undefined,
        items: items.map((item) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
        })),
        address: {
          province: province.trim(),
          city: city.trim(),
          fullAddress: address.trim(),
          postalCode: normalizedPostalCode,
        },
      });

      // پاک کردن پیش‌نویس پس از ثبت موفق
      clearOrder();

      // ریدایرکت به داشبورد + اعلان موفقیت
      router.replace('/home');
      Alert.alert(
        'سفارش ثبت شد',
        order?.trackingCode
          ? `کد پیگیری سفارش: ${toPersianDigits(order.trackingCode)}`
          : 'سفارش شما با موفقیت ثبت شد.',
      );
    } catch {
      Alert.alert(
        'خطا در ثبت سفارش',
        'ثبت سفارش ناموفق بود. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
        <Text className="text-2xl font-bold text-slate-900">ثبت سفارش</Text>
        <Text className="mt-1 text-sm text-slate-500">
          سرویس‌ها را انتخاب کنید و آدرس برداشت را وارد کنید.
        </Text>

        {/* انتخاب سرویس */}
        <View className="mt-6">
          <ServiceSelector />
        </View>

        {/* خلاصه سفارش */}
        <View className="mb-6 flex-row items-center justify-between rounded-2xl bg-brand-light px-4 py-3">
          <Text className="text-sm font-medium text-brand-dark">
            {toPersianDigits(totalItems)} مورد انتخاب شده
          </Text>
          <Text className="text-base font-bold text-brand-dark">
            {formatCurrency(totalPrice, 'toman')}
          </Text>
        </View>

        {/* آدرس برداشت */}
        <Text className="mb-3 text-base font-bold text-slate-900">آدرس برداشت</Text>

        <View className="mb-3 flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-medium text-slate-600">استان</Text>
            <TextInput
              value={province}
              onChangeText={setProvince}
              placeholder="استان"
              placeholderTextColor="#94a3b8"
              textAlign="right"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-xs font-medium text-slate-600">شهر</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="شهر"
              placeholderTextColor="#94a3b8"
              textAlign="right"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
            />
          </View>
        </View>

        <Text className="mb-1.5 text-xs font-medium text-slate-600">آدرس کامل</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="خیابان، کوچه، پلاک و واحد"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
          textAlign="right"
          className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
          style={{ minHeight: 76 }}
        />

        <Text className="mb-1.5 text-xs font-medium text-slate-600">کد پستی</Text>
        <TextInput
          value={toPersianDigits(postalCode)}
          onChangeText={(v: string) => setPostalCode(normalizeDigits(v))}
          placeholder="کد پستی ۱۰ رقمی (اختیاری)"
          placeholderTextColor="#94a3b8"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={10}
          textAlign="right"
          className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
        />

        <Text className="mb-1.5 text-xs font-medium text-slate-600">تلفن تماس</Text>
        <TextInput
          value={toPersianDigits(phone)}
          onChangeText={(v: string) => setPhone(normalizeDigits(v))}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          inputMode="tel"
          maxLength={11}
          textAlign="right"
          className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
        />

        <Text className="mb-1.5 text-xs font-medium text-slate-600">یادداشت (اختیاری)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="یادداشت برای سفیر یا قالیشویی"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={2}
          textAlign="right"
          className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-right text-sm"
          style={{ minHeight: 56 }}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="mb-8 mt-2 flex-row items-center justify-center rounded-2xl bg-brand py-4 active:opacity-80 disabled:opacity-60"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-bold text-white">ثبت نهایی سفارش</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
