import { IsEnum } from 'class-validator';
import { UserRole } from '@yuma/db';

/**
 * تغییر نقش کاربر توسط ادمین — مسیر PATCH /admin/users/:id/role
 */
export class ChangeUserRoleDto {
  /** نقش جدید کاربر */
  @IsEnum(UserRole, { message: 'نقش انتخاب‌شده نامعتبر است' })
  role!: UserRole;
}
