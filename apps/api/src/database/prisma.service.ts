import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@yuma/db';

/**
 * سرویس Prisma — کلاینت دیتابیس پروژه یوما
 * لاگ کوئری‌ها فقط در توسعه فعال است تا در پروداکشن نویز نداشته باشیم
 */
type PrismaLogDefinition = [
  { emit: 'event'; level: 'query' },
  { emit: 'stdout'; level: 'info' },
  { emit: 'stdout'; level: 'warn' },
  { emit: 'stdout'; level: 'error' },
];

type PrismaServiceOptions = {
  log: PrismaLogDefinition;
};

@Injectable()
export class PrismaService extends PrismaClient<PrismaServiceOptions> implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    this.$on('query', (event: Prisma.QueryEvent) => {
      this.logger.debug(`[پایگاه‌داده] ${event.duration}ms — ${event.query} ${event.params}`);
    });

    await this.$connect();
    this.logger.log('اتصال Prisma برقرار شد');
  }
}
