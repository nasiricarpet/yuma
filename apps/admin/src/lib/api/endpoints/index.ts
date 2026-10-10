/**
 * نقشه مسیرهای API — منبع واحد endpoints
 *
 * هر گروه در فایل جداگانه تعریف شده و اینجا تجمیع می‌شود.
 * پایه آدرس‌ها از NEXT_PUBLIC_API_URL خوانده می‌شود (به client.ts مراجعه کنید).
 */
export { authEndpoints } from './auth';
export { orderEndpoints } from './orders';
export { pricingEndpoints } from './pricing';
export { customerEndpoints } from './customers';
export { laundryEndpoints } from './laundries';
export { driverEndpoints } from './drivers';
export { paymentEndpoints } from './payments';
export { settlementEndpoints } from './settlements';
export { dashboardEndpoints } from './dashboard';
export { userEndpoints } from './users';
export { auditEndpoints } from './audit';
export { settingsEndpoints } from './settings';

import { authEndpoints } from './auth';
import { orderEndpoints } from './orders';
import { pricingEndpoints } from './pricing';
import { customerEndpoints } from './customers';
import { laundryEndpoints } from './laundries';
import { driverEndpoints } from './drivers';
import { paymentEndpoints } from './payments';
import { settlementEndpoints } from './settlements';
import { dashboardEndpoints } from './dashboard';
import { userEndpoints } from './users';
import { auditEndpoints } from './audit';
import { settingsEndpoints } from './settings';

/**
 * شیء تجمیعی همه endpoints — برای سازگاری با کدهای موجود.
 *
 * @example
 * apiPost(endpoints.auth.sendOtp, { mobile });
 */
export const endpoints = {
  auth: authEndpoints,
  orders: orderEndpoints,
  pricing: pricingEndpoints,
  customers: customerEndpoints,
  laundries: laundryEndpoints,
  drivers: driverEndpoints,
  payments: paymentEndpoints,
  settlements: settlementEndpoints,
  dashboard: dashboardEndpoints,
  users: userEndpoints,
  audit: auditEndpoints,
  settings: settingsEndpoints,
} as const;
