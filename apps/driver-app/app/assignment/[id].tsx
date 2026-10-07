import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { formatJalaliDate, toPersianDigits } from '@yuma/persian';

type ActionKey = 'pickup' | 'delivered' | 'noShow' | 'damage';

interface ActionConfig {
  key: ActionKey;
  label: string;
  description: string;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}

const actions: ActionConfig[] = [
  { key: 'pickup', label: 'شروع جمع‌آوری', description: 'بار را از خشکشویی تحویل گرفتم', tone: 'primary' },
  { key: 'delivered', label: 'تحویل به مشتری', description: 'سفارش به مشتری تحویل داده شد', tone: 'success' },
  { key: 'noShow', label: 'مشتری حاضر نشد', description: 'در محل حاضر شدم اما مشتری نبود', tone: 'warning' },
  { key: 'damage', label: 'ثبت آسیب', description: 'بار آسیب‌دیده یا نامطابق بود', tone: 'danger' },
];

const toneStyles: Record<ActionConfig['tone'], string> = {
  primary: 'bg-brand',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
};

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [history, setHistory] = useState<string[]>([]);

  const run = (action: ActionConfig) => {
    const stamp = formatJalaliDate(new Date(), 'YYYY/MM/DD — HH:mm');
    setHistory((prev) => [`${action.label} — ${stamp}`, ...prev]);
    Alert.alert('ثبت شد', `${action.label} در ساعت ${formatJalaliDate(new Date(), 'HH:mm')} ثبت شد.`);
  };

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ padding: 24 }}>
      <View className="rounded-2xl border border-slate-200 bg-white p-4">
        <Text className="text-sm text-slate-500">شناسه مأموریت</Text>
        <Text className="mt-1 font-bold text-slate-900">
          {toPersianDigits(String(id ?? ''))}
        </Text>

        <Pressable
          onPress={() => {
            void Linking.openURL('tel:09120000000');
          }}
          className="mt-4 items-center rounded-xl border border-brand py-3 active:opacity-70"
        >
          <Text className="font-bold text-brand">تماس با پشتیبانی</Text>
        </Pressable>
      </View>

      <Text className="mb-3 mt-6 text-base font-bold text-slate-900">اقدام‌ها</Text>

      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={() => run(action)}
          className={`mb-3 rounded-2xl p-4 active:opacity-80 ${toneStyles[action.tone]}`}
        >
          <Text className="font-bold text-white">{action.label}</Text>
          <Text className="mt-1 text-xs text-white/90">{action.description}</Text>
        </Pressable>
      ))}

      <Text className="mb-3 mt-6 text-base font-bold text-slate-900">تاریخچه امروز</Text>
      {history.length === 0 ? (
        <Text className="text-sm text-slate-500">هنوز اقدامی ثبت نشده است.</Text>
      ) : (
        history.map((entry, index) => (
          <Text key={`${entry}-${index}`} className="mb-2 text-sm text-slate-600">
            • {entry}
          </Text>
        ))
      )}
    </ScrollView>
  );
}
