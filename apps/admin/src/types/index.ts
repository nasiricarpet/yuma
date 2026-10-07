/**
 * تایپ‌های مشترک پنل ادمین
 *
 * این ماژول فقط تایپ‌های عمومی (پاسخ API، جدول، وضعیت‌ها) را تعریف می‌کند.
 * تایپ‌های احراز هویت در `lib/auth/types.ts` قرار دارند.
 */

/** ساختار استاندارد پاسخ موفق API بک‌اند */
export interface ApiResponse<T> {
  ok: true;
  data: T;
}

/** ساختار استاندارد پاسخ خطای API بک‌اند */
export interface ApiErrorResponse {
  ok: false;
  /** پیام خطای فارسی قابل نمایش به کاربر */
  message: string;
  /** کد خطای ماشینی */
  code?: string;
  /** خطای اعتبارسنجی فیلدها */
  errors?: Record<string, string[]>;
}

/** پاسخ صفحه‌بندی‌شده لیست‌ها */
export interface PaginatedResponse<T> {
  /** آیتم‌های صفحه جاری */
  data: T[];
  /** کل تعداد آیتم‌ها */
  total: number;
  /** شماره صفحه جاری (از ۱) */
  page: number;
  /** تعداد آیتم‌های هر صفحه */
  perPage: number;
  /** کل تعداد صفحات */
  totalPages: number;
}

/** پارامترهای کوئری لیست‌های صفحه‌بندی‌شده */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  /** جستجوی متنی */
  search?: string;
  /** مرتب‌سازی — مثال: `createdAt:desc` */
  sort?: string;
}

/**
 * وضعیت‌های سفارش — منطبق با OrderStatus در schema.prisma
 * @see packages/db/prisma/schema.prisma
 */
export type OrderStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'at_laundry'
  | 'quotation_sent'
  | 'quotation_approved'
  | 'washing'
  | 'quality_check'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/** وضعیت پیش‌فاکتور */
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected';

/** وضعیت سفیر نسبت به ماموریت */
export type AssignmentStatus = 'pickup' | 'delivery' | 'done' | 'cancelled';

/** برچسب فارسی وضعیت سفارش برای نمایش در UI */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'در انتظار تخصیص',
  assigned: 'تخصیص یافت',
  picked_up: 'برداشته شد',
  at_laundry: 'در قالیشویی',
  quotation_sent: 'پیش‌فاکتور ارسال شد',
  quotation_approved: 'پیش‌فاکتور تأیید شد',
  washing: 'در حال شست‌وشو',
  quality_check: 'کنترل کیفیت',
  ready: 'آماده تحویل',
  out_for_delivery: 'در مسیر تحویل',
  delivered: 'تحویل داده شد',
  cancelled: 'لغو شده',
};

/** برچسب فارسی وضعیت پیش‌فاکتور */
export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'پیش‌نویس',
  sent: 'ارسال شده',
  approved: 'تأیید شده',
  rejected: 'رد شده',
};

export * from '../lib/auth/types';

/* -------------------------------------------------------------------------- */
/*                               موجودیت‌های API                               */
/* -------------------------------------------------------------------------- */

/** کاربر سامانه — مشتری، سفیر یا مدیر قالیشویی */
export interface User {
  id: string;
  mobile: string;
  fullName?: string;
  role: string;
  createdAt: string;
}

/** مشتری در لیست مدیریت */
export interface Customer extends User {
  role: 'customer';
  /** کد ملی */
  nationalCode?: string;
  /** تعداد سفارش‌ها */
  ordersCount?: number;
  /** مجموع خرید به ریال */
  totalSpent?: number;
}

/** قالیشویی */
export interface Workshop {
  id: string;
  name: string;
  /** شهر کارگاه */
  city?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  ownerId?: string;
  createdAt: string;
}

/** سفیر */
export interface Driver {
  id: string;
  userId: string;
  fullName?: string;
  mobile?: string;
  vehicleType?: string;
  /** شماره پلاک وسیله نقلیه */
  plateNumber?: string;
  isActive: boolean;
  currentLat?: number | string;
  currentLng?: number | string;
  createdAt: string;
}

/** آیتم داخل یک سفارش */
export interface OrderItem {
  id: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
}

/** سفارش در لیست مدیریت */
export interface Order {
  id: string;
  trackingCode: string;
  status: OrderStatus;
  customerId: string;
  customer?: Pick<Customer, 'id' | 'fullName' | 'mobile'>;
  laundryId?: string | null;
  laundry?: Pick<Workshop, 'id' | 'name'> | null;
  driverId?: string | null;
  driver?: Pick<Driver, 'id' | 'fullName'> | null;
  items?: OrderItem[];
  totalAmount?: number;
  scheduledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** پیش‌فاکتور */
export interface Quotation {
  id: string;
  orderId: string;
  subtotalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  status: QuotationStatus;
  expiresAt?: string | null;
  createdAt: string;
}

/** پرداخت */
export interface Payment {
  id: string;
  orderId: string;
  trackingCode?: string;
  amount: number;
  /** کد رهگیری درگاه پرداخت */
  referenceId?: string | null;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  gateway?: string;
  paidAt?: string | null;
  createdAt: string;
}

/** آمار کلی داشبورد */
export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalDrivers: number;
  totalWorkshops: number;
  /** سفیران در وضعیت فعال */
  activeDrivers: number;
  /** دادهٔ نمودار درآمد دوره‌ای */
  revenueData: RevenueChartPoint[];
  /** نسبت سفارش‌های لغو شده به کل */
  cancellationRate?: number;
}

/** نقطه داده نمودار درآمد */
export interface RevenueChartPoint {
  /** برچسب فارسی بازه — مثلا «۱۴۰۳/۰۷» */
  label: string;
  revenue: number;
  orders: number;
}
