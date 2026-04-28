import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('coupons')
@ApiBearerAuth()
@Controller('coupons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @RequirePermissions('CREATE_COUPON')
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return await this.couponService.createCoupon(dto);
  }

  @Get()
  @RequirePermissions('READ_COUPON')
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupons retrieved successfully' })
  async findAllCoupons() {
    return await this.couponService.findAllCoupons();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active coupons' })
  @ApiResponse({ status: 200, description: 'Active coupons retrieved successfully' })
  async findActiveCoupons() {
    return await this.couponService.findActiveCoupons();
  }

  @Get(':id')
  @RequirePermissions('READ_COUPON')
  @ApiOperation({ summary: 'Get coupon by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupon retrieved successfully' })
  async findOneCoupon(@Param('id') id: string) {
    return await this.couponService.findOneCoupon(id);
  }

  @Put(':id')
  @RequirePermissions('UPDATE_COUPON')
  @ApiOperation({ summary: 'Update coupon (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return await this.couponService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_COUPON')
  @ApiOperation({ summary: 'Delete coupon (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupon deleted successfully' })
  async deleteCoupon(@Param('id') id: string) {
    return await this.couponService.deleteCoupon(id);
  }

  @Post('validate')
  @RequirePermissions('APPLY_COUPON')
  @ApiOperation({ summary: 'Validate coupon code (Customer only)' })
  @ApiResponse({ status: 200, description: 'Coupon validated successfully' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return await this.couponService.validateCoupon(dto);
  }
}
