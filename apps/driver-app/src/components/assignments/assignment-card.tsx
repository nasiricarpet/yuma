import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@yuma/types';
import { toPersianDigits } from '@yuma/persian';
import { useUpdateAssignmentStatus } from '@/src/lib/api/queries/use-assignments';
import type { Assignment } from '@/src/lib/api/endpoints/assignments';

/**
 * نقشه «اکشن بعدی» بر اساس وضعیت فعلی — کلید، وضعیت فعلی؛ مقدار،
 * برچسب دکمه و وضعیت مقصد پس از کلیک.
 *
 * وضعیت‌های پایانی (`delivered`، `cancelled`) اکشنی ندارند.
 */
const NEXT_ACTIONS: Partial<
  Record<OrderStatus, { label: string; target: OrderStatus }>
> = {
  // در انتظار دریافت از مشتری → تایید دریافت
  assigned: { label: 'تایید دریافت', target: 'picked_up' },
  // تحویل بار در کارگاه
  picked_up: { label: 'تحویل در کارگاه', target: 'at_laundry' },
  // شروع مسیر تحویل به مشتری
  ready: { label: 'شروع مسیر تحویل', target: 'out_for_delivery' },
  // تحویل نهایی به مشتری
  out_for_delivery: { label: 'تایید تحویل', target: 'delivered' },
};

/** رنگ نشانگر وضعیت — از پالت اپ سفیر (آبی) */
const STATUS_TONES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-blue-100 text-blue-700',
  at_laundry: 'bg-indigo-100 text-indigo-700',
  quotation_sent: 'bg-purple-100 text-purple-700',
  quotation_approved: 'bg-purple-100 text-purple-700',
  washing: 'bg-cyan-100 text-cyan-700',
  quality_check: 'bg-cyan-100 text-cyan-700',
  ready: 'bg-teal-100 text-teal-700',
  out_for_delivery: 'bg-teal-100 text-teal-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

/** یک ردیف «برچسب + مقدار» داخل کارت */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2 flex-row items-start justify-between gap-3">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="max-w-[70%] text-left text-sm text-slate-800">{value}</Text>
    </View>
  );
}

/**
 * کارت خلاصه یک وظیفه — اطلاعات سفارش + دکمه اکشن بعدی.
 *
 * @example
 * <AssignmentCard assignment={assignment} />
 */
export default function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const { mutateAsync, isPending } = useUpdateAssignmentStatus();
  const nextAction = NEXT_ACTIONS[assignment.status];

  const handleAction = async () => {
    if (!nextAction) return;
    try {
      await mutateAsync({
        assignmentId: assignment.id,
        newStatus: nextAction.target,
      });
    } catch {
      // خطا در سطوح بالاتر (Alert صفحه) مدیریت می‌شود
    }
  };

  const tone = STATUS_TONES[assignment.status];

  return (
    <View className="rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-slate-900">
          کد پیگیری: {toPersianDigits(assignment.trackingCode)}
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${tone}`}>
          <Text className={`text-xs font-bold ${tone}`}>
            {ORDER_STATUS_LABELS[assignment.status]}
          </Text>
        </View>
      </View>

      <InfoRow label="نوع درخواست" value={assignment.serviceType} />
      <InfoRow label="آدرس مشتری" value={assignment.customerAddress} />
      <InfoRow label="آدرس کارگاه" value={assignment.workshopAddress} />

      {nextAction ? (
        <Pressable
          onPress={() => void handleAction()}
          disabled={isPending}
          className="mt-4 flex-row items-center justify-center rounded-xl bg-brand py-3 active:opacity-80"
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-sm font-bold text-white">{nextAction.label}</Text>
          )}
        </Pressable>
      ) : (
        <Text className="mt-4 text-center text-xs text-slate-400">
          این وظیفه به پایان رسیده است.
        </Text>
      )}
    </View>
  );
}
