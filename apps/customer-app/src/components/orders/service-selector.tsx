import { Pressable, Text, View } from 'react-native';
import { formatCurrency, toPersianDigits } from '@yuma/persian';
import { useOrderStore, type OrderDraftService } from '@/src/store/order-store';

/**
 * لیست قیمت استاتیک سرویس‌های قالیشویی.
 *
 * این داده در این فاز کلاینت‌ساید است؛ در فاز بعد از endpoint
 * سرور خوانده می‌شود.
 */
export const SERVICE_OPTIONS: OrderDraftService[] = [
  {
    id: 'machine-wash',
    name: 'شستشوی ماشینی',
    description: 'قالی و فرش ماشینی',
    unitPrice: 45_000,
  },
  {
    id: 'hand-wash',
    name: 'شستشوی دستباف',
    description: 'قالی دستباف و نفیس',
    unitPrice: 120_000,
  },
  {
    id: 'stain-removal',
    name: 'لکه‌گیری',
    description: 'حذف لکه‌های سرسخت',
    unitPrice: 35_000,
  },
];

/** نمایش یک ردیف سرویس با دکمه‌های افزایش/کاهش تعداد */
function ServiceRow({ option }: { option: OrderDraftService }) {
  const quantity = useOrderStore(
    (state) => state.items.find((i) => i.serviceId === option.id)?.quantity ?? 0,
  );
  const increment = useOrderStore((state) => state.increment);
  const decrement = useOrderStore((state) => state.decrement);

  return (
    <View
      className={`mb-3 flex-row items-center rounded-2xl border bg-white px-4 py-3.5 ${
        quantity > 0 ? 'border-brand' : 'border-slate-200'
      }`}
    >
      <View className="flex-1">
        <Text className="text-base font-bold text-slate-900">{option.name}</Text>
        {option.description ? (
          <Text className="mt-0.5 text-xs text-slate-500">{option.description}</Text>
        ) : null}
        <Text className="mt-1 text-sm font-medium text-brand-dark">
          {formatCurrency(option.unitPrice, 'toman')}
          <Text className="text-xs text-slate-400"> / متر مربع</Text>
        </Text>
      </View>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => decrement(option.id)}
          disabled={quantity === 0}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:opacity-70 disabled:opacity-30"
          accessibilityLabel={`کاهش ${option.name}`}
        >
          <Text className="text-lg font-bold text-slate-700">−</Text>
        </Pressable>

        <Text className="min-w-[28px] text-center text-base font-bold text-slate-900">
          {quantity > 0 ? toPersianDigits(quantity) : '۰'}
        </Text>

        <Pressable
          onPress={() => increment(option)}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-brand active:opacity-70"
          accessibilityLabel={`افزایش ${option.name}`}
        >
          <Text className="text-lg font-bold text-white">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * انتخاب‌گر سرویس‌های قالیشویی — لیست استاتیک با stepper تعداد.
 *
 * تغییرات مستقیماً در `useOrderStore` ذخیره می‌شوند.
 */
export default function ServiceSelector() {
  return (
    <View>
      <Text className="mb-3 text-base font-bold text-slate-900">سرویس‌ها</Text>
      {SERVICE_OPTIONS.map((option) => (
        <ServiceRow key={option.id} option={option} />
      ))}
    </View>
  );
}
