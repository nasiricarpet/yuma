import { ExecutionContext, createParamDecorator } from '@nestjs/common';

/**
 * کاربر احراز هویت‌شده که توسط JwtStrategy روی req.user قرار می‌گیرد
 *
 * @example
 * @Get('me')
 * me(@CurrentUser() user: AuthUser) { ... }
 *
 * @example
 * // دسترسی به یک فیلد خاص
 * me(@CurrentUser('id') userId: string) { ... }
 */
export interface AuthUser {
  /** شناسه کاربر */
  id: string;
  /** شماره موبایل */
  mobile: string;
  /** نقش کاربر */
  role: string;
}

export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    return field ? user?.[field] : user;
  },
);
