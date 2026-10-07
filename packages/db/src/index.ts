import { PrismaClient } from '@prisma/client';

/**
 * نمونه سراسری Prisma در توسعه (جلوگیری از اتصال‌های بی‌شمار در hot-reload)
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
