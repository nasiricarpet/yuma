import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@yuma/types';

/** کلید متادیتا برای نقش‌های موردنیاز یک مسیر */
export const ROLES_KEY = 'roles';

/**
 * دکوراتور @Roles — نقش‌های مجاز برای یک مسیر را تعیین می‌کند
 *
 * @example
 * @Roles('admin', 'laundry_manager')
 * @Get('admin-panel')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
