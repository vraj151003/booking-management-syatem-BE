import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCouponDto } from './create-coupon.dto';
import { CouponStatus } from '../entity/coupon.entity';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @ApiProperty({ enum: CouponStatus, required: false })
  @IsEnum(CouponStatus)
  @IsOptional()
  status?: CouponStatus;
}
