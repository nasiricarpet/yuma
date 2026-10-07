import { IsNumber, Max, Min } from 'class-validator';

/**
 * ثبت موقعیت لحظه‌ای سفیر — مختصات جغرافیایی
 */
export class LogLocationDto {
  /** عرض جغرافیایی — بین ۹۰- و ۹۰ */
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  /** طول جغرافیایی — بین ۱۸۰- و ۱۸۰ */
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
