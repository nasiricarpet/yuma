import { IsBoolean } from 'class-validator';

/**
 * تغییر وضعیت کاربر توسط ادمین — فعال یا غیرفعال
 *
 * کاربر غیرفعال نمی‌تواند وارد شود (گارد JWT بررسی می‌کند)
 * ولی داده‌های او حذف نمی‌شوند.
 */
export class AdminUpdateUserStatusDto {
  /** وضعیت حساب کاربری */
  @IsBoolean({ message: 'وضعیت باید true یا false باشد' })
  isActive!: boolean;
}
