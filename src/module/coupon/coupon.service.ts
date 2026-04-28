import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponStatus, CouponType } from './entity/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
  ) {}

  async createCoupon(dto: CreateCouponDto) {
    const existingCoupon = await this.couponRepo.findOne({
      where: { code: dto.code },
    });

    if (existingCoupon) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponRepo.create({
      ...dto,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      usedCount: 0,
      status: CouponStatus.ACTIVE,
    });

    return await this.couponRepo.save(coupon);
  }

  async findAllCoupons() {
    return await this.couponRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveCoupons() {
    const now = new Date();
    return await this.couponRepo.find({
      where: {
        status: CouponStatus.ACTIVE,
        validFrom: now,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneCoupon(id: string) {
    const coupon = await this.couponRepo.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.findOneCoupon(id);

    if (dto.code && dto.code !== coupon.code) {
      const existingCoupon = await this.couponRepo.findOne({
        where: { code: dto.code },
      });

      if (existingCoupon) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    Object.assign(coupon, dto);

    if (dto.validFrom) {
      coupon.validFrom = new Date(dto.validFrom);
    }

    if (dto.validUntil) {
      coupon.validUntil = new Date(dto.validUntil);
    }

    return await this.couponRepo.save(coupon);
  }

  async deleteCoupon(id: string) {
    const coupon = await this.findOneCoupon(id);
    await this.couponRepo.remove(coupon);
    return { message: 'Coupon deleted successfully' };
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.couponRepo.findOne({
      where: { code: dto.code },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('Coupon is not active');
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (now > validUntil) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon usage limit exceeded');
    }

    if (coupon.minOrderAmount && dto.orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount for this coupon is ${coupon.minOrderAmount}`,
      );
    }

    let discountAmount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discountAmount = (dto.orderAmount * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    if (discountAmount > dto.orderAmount) {
      discountAmount = dto.orderAmount;
    }

    return {
      valid: true,
      couponId: coupon.id,
      discountAmount,
      finalAmount: dto.orderAmount - discountAmount,
    };
  }

  async incrementUsage(couponId: string) {
    const coupon = await this.findOneCoupon(couponId);
    coupon.usedCount += 1;

    if (coupon.usedCount >= coupon.maxUses) {
      coupon.status = CouponStatus.INACTIVE;
    }

    return await this.couponRepo.save(coupon);
  }
}
