import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import type { UserRole } from '@yuma/types';
import type { JwtAuthUser } from '../strategies/jwt.strategy';

/**
 * گارد نقش‌ها — دسترسی را بر اساس @Roles() محدود می‌کند
 * باید بعد از JwtAuthGuard اجرا شود تا req.user پر شده باشد
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // بدون @Roles() محدودیتی نیست
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtAuthUser | undefined = request.user;

    if (!user || !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException();
    }

    return true;
  }
}
