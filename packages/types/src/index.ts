/**
 * @yuma/types — انواع مشترک بین API، وب و موبایل
 */

export type UserRole = 'admin' | 'laundry_manager' | 'laundry_user' | 'driver' | 'customer';

export type OrderStatus =
  | 'pending' // ثبت‌شده، در انتظار تخصیص
  | 'assigned' // تخصیص‌یافته به سفیر
  | 'picked_up' // از مشتری گرفته شد
  | 'at_laundry' // در قالیشویی
  | 'quotation_sent' // فاکتور/برآورد ارسال شد
  | 'quotation_approved' // مشتری تأیید کرد
  | 'washing' // در حال شستشو
  | 'quality_check' // کنترل کیفیت
  | 'ready' // آماده تحویل
  | 'out_for_delivery' // در مسیر تحویل
  | 'delivered' // تحویل شد
  | 'cancelled'; // لغو شد

export interface OrderStatusFlowItem {
  status: OrderStatus;
  label: string;
}

/**
 * جریان فعلی وضعیت‌های سفارش — منبع حقیقت در ماژول orders
 *
 * جریان قدیمی (`OrderStatus`) دست‌نخورده باقی می‌ماند زیرا ماژول‌های
 * pricing/payments/assignments و اپ‌ها هنوز از آن مقادیر استفاده می‌کنند.
 */
export type OrderFlowStatus =
  | 'requested' // ثبت‌شده توسط مشتری
  | 'awaiting_confirmation' // در انتظار تأیید کارگاه
  | 'awaiting_pickup' // تأیید شد، در انتظار سفیر
  | 'picked_up' // سفیر از مشتری تحویل گرفت
  | 'awaiting_assessment' // در کارگاه، در انتظار ارزیابی
  | 'quoted' // برآورد قیمت ارسال شد
  | 'quote_approved' // مشتری برآورد را تأیید کرد
  | 'in_cleaning' // در حال شستشو
  | 'quality_control' // کنترل کیفیت
  | 'ready_for_delivery' // آماده تحویل
  | 'out_for_delivery' // در مسیر تحویل
  | 'delivered' // تحویل شد
  | 'closed' // بسته شد
  | 'cancelled'; // لغو شد

export interface OrderFlowItem {
  status: OrderFlowStatus;
  label: string;
}

/** جریان اصلی وضعیت‌های سفارش (به ترتیب) */
export const ORDER_FLOW: OrderFlowItem[] = [
  { status: 'requested', label: 'ثبت‌شده' },
  { status: 'awaiting_confirmation', label: 'در انتظار تأیید کارگاه' },
  { status: 'awaiting_pickup', label: 'در انتظار سفیر' },
  { status: 'picked_up', label: 'تحویل‌گرفته سفیر' },
  { status: 'awaiting_assessment', label: 'در انتظار ارزیابی' },
  { status: 'quoted', label: 'برآورد ارسال شد' },
  { status: 'quote_approved', label: 'تأیید مشتری' },
  { status: 'in_cleaning', label: 'در حال شستشو' },
  { status: 'quality_control', label: 'کنترل کیفیت' },
  { status: 'ready_for_delivery', label: 'آماده تحویل' },
  { status: 'out_for_delivery', label: 'در مسیر تحویل' },
  { status: 'delivered', label: 'تحویل‌شده' },
  { status: 'closed', label: 'بسته‌شده' },
  { status: 'cancelled', label: 'لغو‌شده' },
];

export const ORDER_FLOW_LABELS: Record<OrderFlowStatus, string> =
  Object.fromEntries(ORDER_FLOW.map((s) => [s.status, s.label])) as Record<
    OrderFlowStatus,
    string
  >;

const ORDER_FLOW_STATUSES = new Set<string>(ORDER_FLOW.map((s) => s.status));

/** نوع‌نگهبان وضعیت‌های جریان فعلی — مقادیر جریان قدیمی را رد می‌کند */
export function isOrderFlowStatus(value: unknown): value is OrderFlowStatus {
  return typeof value === 'string' && ORDER_FLOW_STATUSES.has(value);
}

/** جریان اصلی وضعیت‌های سفارش (به ترتیب) */
export const ORDER_STATUS_FLOW: OrderStatusFlowItem[] = [
  { status: 'pending', label: 'ثبت‌شده' },
  { status: 'assigned', label: 'تخصیص‌یافته' },
  { status: 'picked_up', label: 'تحویل‌گرفته سفیر' },
  { status: 'at_laundry', label: 'دریافت در قالیشویی' },
  { status: 'quotation_sent', label: 'ارسال برآورد قیمت' },
  { status: 'quotation_approved', label: 'تأیید مشتری' },
  { status: 'washing', label: 'در حال شستشو' },
  { status: 'quality_check', label: 'کنترل کیفیت' },
  { status: 'ready', label: 'آماده تحویل' },
  { status: 'out_for_delivery', label: 'در مسیر تحویل' },
  { status: 'delivered', label: 'تحویل‌شده' },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = Object.fromEntries(
  ORDER_STATUS_FLOW.map((s) => [s.status, s.label]),
) as Record<OrderStatus, string>;

/** وضعیت‌های اضافه که در جریان اصلی نیستند */
ORDER_STATUS_LABELS.cancelled = 'لغو‌شده';

export type CurrencyUnit = 'toman' | 'rial';

export interface Money {
  /** مبلغ به ریال (واحد ذخیره‌سازی) */
  amount: number;
  currency: 'IRT' | 'IRR';
}

export interface User {
  id: string;
  mobile: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  areaSqm?: number;
}

export interface Order {
  id: string;
  trackingCode: string;
  customerId: string;
  laundryId?: string;
  driverId?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: Money;
  address: OrderAddress;
  pickupTimeSlot?: string;
  deliveryTimeSlot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAddress {
  province: string;
  city: string;
  postalCode: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

export interface Laundry {
  id: string;
  name: string;
  ownerId: string;
  city: string;
  isActive: boolean;
}

export interface Driver {
  id: string;
  userId: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  isActive: boolean;
}
