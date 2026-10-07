import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * ماژول سراسری Redis — سرویس کش در همه ماژول‌ها در دسترس است
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
