import { Module } from '@nestjs/common';
import { AuditModule } from '../audit-log/audit.module';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

/**
 * ماژول کاربران — پروفایل، دفترچه آدرس و عملیات ادمین
 *
 * UsersController مسیرهای /me و AdminUsersController مسیرهای /admin/users را
 * پوشش می‌دهند. AuditModule برای ثبت رویدادهای تغییرات کاربران import شده است.
 * گارد JWT و گارد نقش‌ها به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@Module({
  imports: [AuditModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
