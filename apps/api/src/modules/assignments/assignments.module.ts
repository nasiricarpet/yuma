import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

/**
 * ماژول وظایف سفیران — دریافت و تحویل سفارش‌ها
 *
 * گارد JWT و RolesGuard به صورت سراسری در AuthModule ثبت شده‌اند
 * و نیازی به import مجدد آن‌ها در اینجا نیست.
 */
@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
