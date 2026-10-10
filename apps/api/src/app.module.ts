import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { LaundriesModule } from './modules/laundries/laundries.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PaymentModule } from './shared/payment/payment.module';
import { MailModule } from './common/mail/mail.module';
import { AuditModule } from './modules/audit-log/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // پنجره ۶۰ ثانیه‌ای
        limit: 100, // حداکثر ۱۰۰ درخواست در دقیقه برای هر IP
      },
    ]),
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      // اتصال به Redis از طریق REDIS_URL — همان اتصالی که سرویس کش استفاده می‌کند
      useFactory: (config: ConfigService) => {
        const url = new URL(
          config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        );
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
            db: Number(url.pathname.slice(1)) || 0,
          },
        };
      },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    LaundriesModule,
    DriversModule,
    AssignmentsModule,
    PricingModule,
    PaymentsModule,
    PaymentModule,
    MailModule,
    AuditModule,
    SettingsModule,
    NotificationsModule,
    LedgerModule,
    SupportModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
