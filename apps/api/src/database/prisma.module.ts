import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * ماژول سراسری Prisma — کلاینت دیتابیس در همه ماژول‌ها در دسترس است
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
