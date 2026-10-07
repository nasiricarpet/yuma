import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * ماژول کاربران — پروفایل و دفترچه آدرس
 * گارد JWT به صورت سراسری در AuthModule ثبت شده است
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
