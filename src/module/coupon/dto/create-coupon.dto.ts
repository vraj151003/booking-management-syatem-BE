import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { CouponType } from '../entity/coupon.entity';

export class CreateCouponDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty({ enum: CouponType })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number;

  @ApiProperty()
  @IsDateString()
  validFrom: string;

  @ApiProperty()
  @IsDateString()
  validUntil: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
