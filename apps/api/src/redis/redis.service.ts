import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * سرویس Redis — کش پروژه یوما
 * از طریق REDIS_URL متصل و در زمان بسته‌شدن ماژول قطع می‌شود
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL as string);

    this.client.on('error', (error: Error) => {
      this.logger.error(`خطای Redis: ${error.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
    this.logger.log('اتصال Redis قطع شد');
  }
}
