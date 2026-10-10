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

/**
 * نقش‌های پرسنلی سامانه — منطبق با STAFF_ROLES در UsersService
 * @see apps/api/src/modules/users/users.service.ts
 */
export type StaffRole = 'admin' | 'manager' | 'expert' | 'support' | 'finance';

/** لیست نقش‌های پرسنلی — برای render در select‌ها و جدول */
export const STAFF_ROLES: readonly StaffRole[] = [
  'admin',
  'manager',
  'expert',
  'support',
  'finance',
] as const;

/** برچسب فارسی هر نقش پرسنلی */
export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'مدیر سیستم',
  manager: 'مدیر عملیات',
  expert: 'کارشناس',
  support: 'پشتیبان',
  finance: 'مالی',
};

/** تن رنگی بج نقش پرسنلی */
export const STAFF_ROLE_TONE: Record<
  StaffRole,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  admin: 'danger',
  manager: 'info',
  expert: 'success',
  support: 'warning',
  finance: 'neutral',
};

/** عضو پرسنل — خروجی GET /admin/users/staff */
export interface StaffMember {
  id: string;
  fullName: string;
  mobile: string;
  /** ایمیل — اختیاری */
  email?: string | null;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

/** فیلترهای لیست پرسنل در UI */
export interface StaffListParams {
  /** فیلتر بر اساس نقش */
  role?: StaffRole;
  /** فیلتر بر اساس وضعیت حساب */
  isActive?: boolean;
}

/** دادهٔ فرم ساخت/ویرایش پرسنل */
export interface StaffFormValues {
  fullName: string;
  mobile: string;
  email: string;
  role: StaffRole;
  /** رمز عبور — اختیاری (پر شده = تنظیم/تغییر رمز) */
  password: string;
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

/* -------------------------------------------------------------------------- */
/*                                  لاگ ممیزی                                 */
/* -------------------------------------------------------------------------- */

/**
 * نوع عمل ثبت‌شده در لاگ ممیزی — منطبق با `AuditAction` در AuditService
 * @see apps/api/src/modules/audit-log/audit.service.ts
 */
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'change-role'
  | 'login'
  | 'logout';

/** لیست انواع عمل ممیزی — برای render در select‌ها و فیلترها */
export const AUDIT_ACTIONS: readonly AuditAction[] = [
  'create',
  'update',
  'delete',
  'change-role',
  'login',
  'logout',
] as const;

/** برچسب فارسی هر عمل ممیزی */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: 'ایجاد',
  update: 'ویرایش',
  delete: 'حذف',
  'change-role': 'تغییر نقش',
  login: 'ورود',
  logout: 'خروج',
};

/** تن رنگی بج هر عمل ممیزی */
export const AUDIT_ACTION_TONE: Record<
  AuditAction,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  'change-role': 'warning',
  login: 'neutral',
  logout: 'neutral',
};

/**
 * یک رویداد ممیزی — خروجی GET /admin/audit-log
 *
 * `before`/`after` مقدار JSON دلخواه هستند (یا `null` برای رویدادهای
 * سیستمی مثل ورود/خروج).
 */
export interface AuditLogEntry {
  id: string;
  /** شناسه کاربری که عمل را انجام داده — برای رویدادهای سیستمی NULL */
  actorId?: string | null;
  /** نقش کاربر در لحظه‌ی انجام عمل */
  actorRole?: string | null;
  action: AuditAction;
  /** نوع موجودیت: user, order, ... */
  entityType: string;
  /** شناسه موجودیت هدف */
  entityId?: string | null;
  /** وضعیت موجودیت پیش از تغییر */
  before?: unknown;
  /** وضعیت موجودیت پس از تغییر */
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  /** شناسه‌ی یکتای درخواست — برای ردیابی یک زنجیره‌ی کامل */
  requestId?: string | null;
  createdAt: string;
}

/** فیلترهای لیست ممیزی — منطبق با ListAuditDto بک‌اند */
export interface AuditListParams {
  /** شماره صفحه — از ۱ شروع می‌شود */
  page?: number;
  /** تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
  limit?: number;
  /** شناسه کاربری که عمل را انجام داده */
  actorId?: string;
  /** نوع عمل */
  action?: AuditAction;
  /** نوع موجودیت — مثلاً user */
  entityType?: string;
  /** شناسه موجودیت هدف */
  entityId?: string;
  /** شروع بازه‌ی زمانی (تاریخ میلادی؛ به ISO تبدیل می‌شود) */
  from?: Date;
  /** پایان بازه‌ی زمانی (تاریخ میلادی؛ به ISO تبدیل می‌شود) */
  to?: Date;
}

/**
 * آمار رویدادهای ممیزی — خروجی GET /admin/audit-log/stats
 * @see apps/api/src/modules/audit-log/audit.service.ts
 */
export interface AuditStats {
  /** کل تعداد رویدادهای منطبق با فیلترها */
  total: number;
  /** تفکیک تعداد بر اساس نوع عمل */
  byAction: Record<string, number>;
  /** تفکیک تعداد بر اساس نوع موجودیت */
  byEntityType: Record<string, number>;
}

/* -------------------------------------------------------------------------- */
/*                                   تنظیمات                                   */
/* -------------------------------------------------------------------------- */

/**
 * دسته‌بندی تنظیمات — بخش اول کلید در مدل `Setting`
 * @see packages/db/prisma/schema.prisma
 */
export type SettingCategory =
  | 'brand'
  | 'contact'
  | 'order'
  | 'payment'
  | 'sms'
  | 'features';

/**
 * یک رکورد تنظیم — منطبق با مدل `Setting` در schema.prisma
 * @see packages/db/prisma/schema.prisma
 */
export interface Setting {
  id: string;
  /** کلید یکتای نقطه‌گذاری — مثلاً `brand.primaryColor` */
  key: string;
  /** مقدار تنظیم — هر JSON معتبر (رشته، عدد یا بولین) */
  value: unknown;
  /** دسته‌بندی — بخش اول کلید */
  category: SettingCategory | string;
  /** آیا برای کاربران عمومی قابل مشاهده است؟ */
  isPublic: boolean;
  /** شناسه ادمینی که آخرین بار تغییر داده */
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** فیلترهای لیست تنظیمات — منططبق با ListSettingsDto بک‌اند */
export interface SettingsListParams {
  /** شماره صفحه — از ۱ شروع می‌شود */
  page?: number;
  /** تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
  limit?: number;
  /** دسته‌بندی: brand, contact, order, payment, sms, features */
  category?: SettingCategory;
  /** محدود کردن به تنظیمات عمومی یا غیرعمومی */
  isPublic?: boolean;
}

/** نقشه‌ی «کلید → مقدار» — خروجی نرمال‌شده‌ی `listSettings` */
export type SettingsMap = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/*                              تسویه‌ی کارگاه‌ها                              */
/* -------------------------------------------------------------------------- */

/**
 * وضعیت تسویه‌ی دوره‌ای کارگاه — منطبق با `SettlementStatus` در schema.prisma
 * @see packages/db/prisma/schema.prisma
 */
export type SettlementStatus = 'pending' | 'paid';

/** برچسب فارسی وضعیت تسویه */
export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
};

/** تن رنگی بج وضعیت تسویه */
export const SETTLEMENT_STATUS_TONE: Record<
  SettlementStatus,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  pending: 'warning',
  paid: 'success',
};

/**
 * یک ردیف تسویه‌ی دوره‌ای — خروجی GET /admin/settlements
 *
 * مبالغ در دیتابیس `BigInt` هستند و بک‌اند آن‌ها را به‌صورت رشته
 * سریال می‌کند؛ با `Number()` به ریال تبدیل می‌شوند.
 */
export interface Settlement {
  id: string;
  workshopId: string;
  /** شروع دوره — اولین روز ماه میلادی (ISO) */
  periodStart: string;
  /** پایان دوره — انحصاری (ISO) */
  periodEnd: string;
  /** جمع کل پرداخت‌های کارگاه در دوره (ریال) */
  grossMinor: string;
  /** کارمزد پلتفرم در دوره (ریال) */
  commissionMinor: string;
  /** مبلغ خالص قابل پرداخت به کارگاه (ریال) */
  netPayableMinor: string;
  status: SettlementStatus;
  paidAt?: string | null;
  /** مرجع پرداخت بانکی تسویه — شناسه‌ی حواله یا فیش */
  reference?: string | null;
  createdAt: string;
  /** کارگاه — بک‌اند آن را join می‌کند */
  workshop?: Pick<Workshop, 'id' | 'name' | 'city'> | null;
}

/** فیلترهای لیست تسویه‌ها — منطبق با ListSettlementsDto بک‌اند */
export interface SettlementListParams {
  /** شماره صفحه — از ۱ شروع می‌شود */
  page?: number;
  /** تعداد آیتم در هر صفحه (حداکثر ۱۰۰) */
  limit?: number;
  /** محدود کردن لیست به یک کارگاه */
  workshopId?: string;
  /** وضعیت تسویه */
  status?: SettlementStatus;
  /** دوره به فرمت میلادی YYYY-MM — مثلاً 2026-09 */
  month?: string;
}

/** نوع کنترل فرم برای یک فیلد تنظیمات */
export type SettingFieldType =
  | 'text'
  | 'number'
  | 'color'
  | 'tel'
  | 'email'
  | 'switch';

/**
 * مشخصات یک فیلد در فرم تنظیمات — رابط کاربری از این رجیستر ساخته می‌شود.
 * کلیدها منطبق با `DEFAULT_SETTINGS` در seed هستند.
 * @see packages/db/prisma/seed.ts
 */
export interface SettingFieldConfig {
  /** کلید تنظیم در دیتابیس */
  key: string;
  /** برچسب فارسی فیلد */
  label: string;
  /** توضیح کوتاه زیر برچسب */
  description?: string;
  /** نوع کنترل */
  type: SettingFieldType;
  /** مقدار نمونه‌ی ورودی */
  placeholder?: string;
  /** حداقل فیلدهای عددی */
  min?: number;
  /** حداکثر فیلدهای عددی */
  max?: number;
  /** گام افزایش برای فیلدهای عددی */
  step?: number;
  /** واحد نمایشی کنار فیلد عددی */
  suffix?: string;
  /** مبلغ ریالی است و هم‌زمان معادل تومانی نشان داده می‌شود */
  isRial?: boolean;
  /** مقدار پیش‌فرض در نبود تنظیم ذخیره‌شده */
  defaultValue?: string | number | boolean;
}

/* -------------------------------------------------------------------------- */
/*                              تیکت‌های پشتیبانی                              */
/* -------------------------------------------------------------------------- */

/** دسته‌بندی تیکت پشتیبانی — منطبق با schema.prisma */
export type SupportTicketCategory =
  | 'order_issue'
  | 'payment_issue'
  | 'delivery_issue'
  | 'quality_issue'
  | 'account_issue'
  | 'other';

/** اولویت تیکت — تعیین‌کننده‌ی مهلت پاسخ اولیه (SLA) */
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/** وضعیت تیکت — `closed` حالت پایانی است */
export type SupportTicketStatus =
  | 'open'
  | 'pending_agent'
  | 'resolved'
  | 'closed';

/** قابلیت دیدن یک پیام — پیام داخلی برای مشتری فیلتر می‌شود */
export type SupportMessageVisibility = 'public' | 'internal';

/**
 * یک تیکت پشتیبانی.
 *
 * `firstResponseAt` با اولین پاسخ پشتیبان پر می‌شود و معیار رعایت SLA است.
 * `slaDueAt` مهلت پاسخ اولیه است که از زمان ثبت بر اساس اولویت محاسبه می‌شود.
 */
export interface SupportTicket {
  id: string;
  /** سفارش مرتبط — اختیاری */
  orderId?: string | null;
  /** مشتری باز کردن‌کننده‌ی تیکت */
  customerId: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  subject: string;
  /** کارشناس پشتیبانیِ تخصیص‌یافته — تا تخصیص null است */
  assignedToId?: string | null;
  /** مهلت پاسخ اولیه */
  slaDueAt?: string | null;
  /** زمان اولین پاسخ پشتیبان */
  firstResponseAt?: string | null;
  /** زمان حل تیکت */
  resolvedAt?: string | null;
  /** امتیاز رضایت مشتری (۱ تا ۵) — هنگام بستن ثبت می‌شود */
  satisfaction?: number | null;
  createdAt: string;
  updatedAt: string;

  /** سفارش مرتبط — بک‌اند آن را join می‌کند */
  order?: { id: string; trackingCode: string } | null;
  /** مشتری — بک‌اند آن را join می‌کند */
  customer?: { id: string; fullName: string; mobile: string } | null;
  /** کارشناس تخصیص‌یافته — بک‌اند آن را join می‌کند */
  assignedTo?: { id: string; fullName: string } | null;
  /** پیام‌های تیکت — در نمای لیست آخرین پیام است */
  messages?: SupportMessage[];
}

/** یک پیام در تیکت پشتیبانی */
export interface SupportMessage {
  /** شناسه‌ی پیام در دیتابیس BigInt است و به‌صورت رشته سریال می‌شود */
  id: string;
  ticketId: string;
  /** فرستنده — برای یادداشت‌های خودکار سیستم null است */
  senderUserId?: string | null;
  visibility: SupportMessageVisibility;
  body: string;
  createdAt: string;
  /** کاربر فرستنده — بک‌اند آن را join می‌کند */
  senderUser?: {
    id: string;
    fullName: string;
    role: string;
  } | null;
}

/** فیلترهای لیست تیکت‌ها — منطبق با ListTicketsDto بک‌اند */
export interface SupportTicketListParams {
  /** شماره صفحه — از ۱ شروع می‌شود */
  page?: number;
  /** تعداد آیتم در هر صفحه (حداکثر ۵۰) */
  limit?: number;
  /** وضعیت تیکت */
  status?: SupportTicketStatus;
  /** دسته‌بندی تیکت */
  category?: SupportTicketCategory;
  /** اولویت تیکت */
  priority?: SupportTicketPriority;
  /** فقط تیکت‌های تخصیص‌نیافته — مقدار 'true' */
  unassigned?: 'true';
  /** فقط تیکت‌های سررسید‌شده‌ی بدون پاسخ — مقدار 'true' */
  slaBreached?: 'true';
  /** جستجو در موضوع و کد پیگیری سفارش */
  search?: string;
}

/** برچسب فارسی دسته‌بندی تیکت */
export const TICKET_CATEGORY_LABELS: Record<SupportTicketCategory, string> = {
  order_issue: 'مشکل سفارش',
  payment_issue: 'مشکل پرداخت',
  delivery_issue: 'مشکل تحویل',
  quality_issue: 'کیفیت شست‌وشو',
  account_issue: 'مشکل حساب کاربری',
  other: 'سایر',
};

/** برچسب فارسی اولویت تیکت */
export const TICKET_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  urgent: 'فوری',
};

/** برچسب فارسی وضعیت تیکت */
export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'باز',
  pending_agent: 'در حال پیگیری',
  resolved: 'حل‌شده',
  closed: 'بسته‌شده',
};
