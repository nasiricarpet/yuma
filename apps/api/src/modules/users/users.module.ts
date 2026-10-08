import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from './users.service';

/**
 * ماژول کاربران — پروفایل، دفترچه آدرس و عملیات ادمین
 *
 * UsersController مسیرهای /me و AdminUsersController مسیرهای /admin/users را
 * پوشش می‌دهند. گارد JWT و گارد نقش‌ها به صورت سراسری در AuthModule ثبت شده‌اند.
 */
@Module({
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
