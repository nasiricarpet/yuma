import { Module } from '@nestjs/common';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { PublicSettingsController } from './controllers/public-settings.controller';
import { SettingsService } from './settings.service';

/**
 * ماژول تنظیمات — پیکربندی پویای سیستم در دیتابیس
 *
 * SettingsService به سایر ماژول‌ها export می‌شود تا سرویس‌ها
 * بتوانند مقادیر تنظیمات را بخوانند (مثل نرخ کامیسون یا TTL OTP).
 */
@Module({
  controllers: [AdminSettingsController, PublicSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
