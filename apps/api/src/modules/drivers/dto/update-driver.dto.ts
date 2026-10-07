import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VehicleType } from '@yuma/db';

/**
 * ویرایش پروفایل سفیر — نوع وسیله نقلیه و شماره پلاک
 */
export class UpdateDriverDto {
  /** نوع وسیله نقلیه */
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  /** شماره پلاک وسیله نقلیه */
  @IsOptional()
  @IsString()
  plateNumber?: string;
}
