import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { faMessages } from '../../common/messages.fa';

/**
 * سرویس وظایف سفیران — دریافت و تحویل سفارش‌ها
 *
 * هر سفیر فقط وظایف خودش را می‌بیند و مالکیت با userId بررسی می‌شود.
 * تکمیل هر فاز، وضعیت Order را در یک تراکنش اتمیک به جلو می‌برد.
 */
@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * یافتن شناسه سفیر متصل به این کاربر —
   * در صورت نبود NotFoundException پرتاب می‌شود
   */
  private async getDriverId(userId: string): Promise<string> {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!driver) throw new NotFoundException(faMessages.driver.notFound);

    return driver.id;
  }

  /** لیست وظایف سفیر همراه با اطلاعات سفارش مرتبط */
  async getMyAssignments(userId: string) {
    const driverId = await this.getDriverId(userId);

    return this.prisma.assignment.findMany({
      where: { driverId },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * تغییر وضعیت وظیفه — در صورت تکمیل، سفارش هم به جلو می‌رود.
   * همه عملیات در یک تراکنش اتمیک انجام می‌شوند
   */
  async updateStatus(userId: string, assignmentId: string, status: string) {
    const driverId = await this.getDriverId(userId);

    // فقط وظیفه متعلق به این سفیر قابل تغییر است
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, driverId },
      select: { orderId: true, phase: true },
    });

    if (!assignment) throw new NotFoundException(faMessages.assignment.notFound);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id: assignmentId },
        data: { status },
      });

      // تکمیل فاز، وضعیت سفارش را در جریان عملیات به جلو می‌برد
      if (status === 'done') {
        const nextOrderStatus =
          assignment.phase === 'pickup' ? 'picked_up' : 'delivered';

        await tx.order.update({
          where: { id: assignment.orderId },
          data: { status: nextOrderStatus },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: assignment.orderId,
            status: nextOrderStatus,
            note: `تکمیل فاز ${assignment.phase} توسط سفیر`,
            actorId: userId,
            actorRole: 'driver',
          },
        });
      }

      return updated;
    });
  }
}
