import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Coupon, CouponStatus, CouponType } from './entity/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

describe('CouponService', () => {
  let service: CouponService;
  let couponRepo: jest.Mocked<Repository<Coupon>>;

  const createMockCoupon = (): Coupon => ({
    id: 'coupon-123',
    code: 'SAVE20',
    type: CouponType.PERCENTAGE,
    discountValue: 20,
    maxUses: 100,
    usedCount: 5,
    minOrderAmount: 100,
    maxDiscountAmount: 50,
    validFrom: new Date('2026-01-01'),
    validUntil: new Date('2026-12-31'),
    status: CouponStatus.ACTIVE,
    description: '20% off',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockCouponRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: mockCouponRepo,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    couponRepo = module.get(getRepositoryToken(Coupon));
    jest.clearAllMocks();
  });

  describe('createCoupon', () => {
    const validDto: CreateCouponDto = {
      code: 'SAVE20',
      type: CouponType.PERCENTAGE,
      discountValue: 20,
      maxUses: 100,
      minOrderAmount: 100,
      maxDiscountAmount: 50,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      description: '20% off',
    };

    it('should create coupon successfully', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);
      const newCoupon = { ...createMockCoupon(), usedCount: 0 };
      mockCouponRepo.create.mockReturnValue(newCoupon);
      mockCouponRepo.save.mockResolvedValue(newCoupon);

      // Act
      const result = await service.createCoupon(validDto);

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
      expect(mockCouponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'SAVE20',
          type: CouponType.PERCENTAGE,
          discountValue: 20,
          usedCount: 0,
          status: CouponStatus.ACTIVE,
        }),
      );
      expect(mockCouponRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        code: 'SAVE20',
        type: CouponType.PERCENTAGE,
        discountValue: 20,
        usedCount: 0,
        status: CouponStatus.ACTIVE,
      });
    });

    it('should throw error if coupon code already exists', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());

      // Act & Assert
      await expect(service.createCoupon(validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createCoupon(validDto)).rejects.toThrow(
        'Coupon code already exists',
      );
    });

    it('should create coupon with FIXED type', async () => {
      // Arrange
      const fixedDto: CreateCouponDto = {
        ...validDto,
        type: CouponType.FIXED,
        discountValue: 50,
      };
      mockCouponRepo.findOne.mockResolvedValue(null);
      mockCouponRepo.create.mockReturnValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.createCoupon(fixedDto);

      // Assert
      expect(mockCouponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CouponType.FIXED,
          discountValue: 50,
        }),
      );
    });

    it('should create coupon without optional fields', async () => {
      // Arrange
      const minimalDto: CreateCouponDto = {
        code: 'MINIMAL',
        type: CouponType.PERCENTAGE,
        discountValue: 10,
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
      };
      mockCouponRepo.findOne.mockResolvedValue(null);
      mockCouponRepo.create.mockReturnValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.createCoupon(minimalDto);

      // Assert
      expect(mockCouponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'MINIMAL',
          discountValue: 10,
        }),
      );
    });

    it('should convert date strings to Date objects', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);
      mockCouponRepo.create.mockReturnValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.createCoupon(validDto);

      // Assert
      expect(mockCouponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          validFrom: expect.any(Date),
          validUntil: expect.any(Date),
        }),
      );
    });

    it('should create coupon without maxUses', async () => {
      // Arrange
      const dtoWithoutMaxUses: CreateCouponDto = {
        code: 'TEST',
        type: CouponType.PERCENTAGE,
        discountValue: 10,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      };
      mockCouponRepo.findOne.mockResolvedValue(null);
      mockCouponRepo.create.mockReturnValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.createCoupon(dtoWithoutMaxUses);

      // Assert
      expect(mockCouponRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TEST',
          discountValue: 10,
        }),
      );
    });
  });

  describe('findAllCoupons', () => {
    it('should return all coupons ordered by createdAt DESC', async () => {
      // Arrange
      const coupons = [createMockCoupon(), { ...createMockCoupon(), id: 'coupon-456' }];
      mockCouponRepo.find.mockResolvedValue(coupons);

      // Act
      const result = await service.findAllCoupons();

      // Assert
      expect(mockCouponRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(coupons);
    });

    it('should return empty array when no coupons exist', async () => {
      // Arrange
      mockCouponRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findAllCoupons();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findActiveCoupons', () => {
    it('should return active coupons with validFrom matching current date', async () => {
      // Arrange
      const activeCoupons = [createMockCoupon()];
      mockCouponRepo.find.mockResolvedValue(activeCoupons);

      // Act
      const result = await service.findActiveCoupons();

      // Assert
      expect(mockCouponRepo.find).toHaveBeenCalledWith({
        where: {
          status: CouponStatus.ACTIVE,
          validFrom: expect.any(Date),
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(activeCoupons);
    });

    it('should return empty array when no active coupons', async () => {
      // Arrange
      mockCouponRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findActiveCoupons();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findOneCoupon', () => {
    it('should return coupon by id', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());

      // Act
      const result = await service.findOneCoupon('coupon-123');

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'coupon-123' },
      });
      expect(result).toMatchObject({
        id: 'coupon-123',
        code: 'SAVE20',
      });
    });

    it('should throw NotFoundException when coupon not found', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneCoupon('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneCoupon('invalid-id')).rejects.toThrow(
        'Coupon not found',
      );
    });

    it('should handle empty string id', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneCoupon('')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCoupon', () => {
    const updateDto: UpdateCouponDto = {
      code: 'UPDATED',
      discountValue: 30,
    };

    it('should update coupon successfully', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.findOne.mockResolvedValueOnce(createMockCoupon()).mockResolvedValueOnce(null);
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      const result = await service.updateCoupon('coupon-123', updateDto);

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'coupon-123' },
      });
      expect(mockCouponRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'coupon-123',
        code: 'SAVE20',
      });
    });

    it('should throw error if new code already exists', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());

      // Act & Assert
      await expect(service.updateCoupon('coupon-123', updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateCoupon('coupon-123', updateDto)).rejects.toThrow(
        'Coupon code already exists',
      );
    });

    it('should not check code uniqueness if code is not being changed', async () => {
      // Arrange
      const sameCodeDto: UpdateCouponDto = {
        code: 'SAVE20',
        discountValue: 30,
      };
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.updateCoupon('coupon-123', sameCodeDto);

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should update validFrom date if provided', async () => {
      // Arrange
      const dateUpdateDto: UpdateCouponDto = {
        validFrom: '2024-06-01',
      };
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.updateCoupon('coupon-123', dateUpdateDto);

      // Assert
      expect(mockCouponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          validFrom: new Date('2024-06-01'),
        }),
      );
    });

    it('should update validUntil date if provided', async () => {
      // Arrange
      const dateUpdateDto: UpdateCouponDto = {
        validUntil: '2024-12-31',
      };
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.updateCoupon('coupon-123', dateUpdateDto);

      // Assert
      expect(mockCouponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          validUntil: new Date('2024-12-31'),
        }),
      );
    });

    it('should update status if provided', async () => {
      // Arrange
      const statusUpdateDto: UpdateCouponDto = {
        status: CouponStatus.INACTIVE,
      };
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      await service.updateCoupon('coupon-123', statusUpdateDto);

      // Assert
      expect(mockCouponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CouponStatus.INACTIVE,
        }),
      );
    });

    it('should handle empty update object', async () => {
      // Arrange
      const emptyDto: UpdateCouponDto = {};
      mockCouponRepo.findOne.mockResolvedValue(createMockCoupon());
      mockCouponRepo.save.mockResolvedValue(createMockCoupon());

      // Act
      const result = await service.updateCoupon('coupon-123', emptyDto);

      // Assert
      expect(result).toMatchObject({
        id: 'coupon-123',
        code: 'SAVE20',
      });
    });
  });

  describe('deleteCoupon', () => {
    it('should delete coupon successfully', async () => {
      // Arrange
      const coupon = createMockCoupon();
      mockCouponRepo.findOne.mockResolvedValue(coupon);
      mockCouponRepo.remove.mockResolvedValue(coupon);

      // Act
      const result = await service.deleteCoupon('coupon-123');

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'coupon-123' },
      });
      expect(mockCouponRepo.remove).toHaveBeenCalledWith(coupon);
      expect(result).toEqual({ message: 'Coupon deleted successfully' });
    });

    it('should throw NotFoundException when coupon not found', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteCoupon('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateCoupon', () => {
    const validateDto: ValidateCouponDto = {
      code: 'SAVE20',
      orderAmount: 500,
    };

    it('should validate coupon successfully with PERCENTAGE type', async () => {
      // Arrange
      const couponWithoutCap = { ...createMockCoupon(), maxDiscountAmount: null };
      mockCouponRepo.findOne.mockResolvedValue(couponWithoutCap);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { code: 'SAVE20' },
      });
      expect(result).toEqual({
        valid: true,
        couponId: 'coupon-123',
        discountAmount: 100,
        finalAmount: 400,
      });
    });

    it('should validate coupon successfully with FIXED type', async () => {
      // Arrange
      const fixedCoupon = { ...createMockCoupon(), type: CouponType.FIXED, discountValue: 50 };
      mockCouponRepo.findOne.mockResolvedValue(fixedCoupon);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(result).toEqual({
        valid: true,
        couponId: 'coupon-123',
        discountAmount: 50,
        finalAmount: 450,
      });
    });

    it('should throw error if coupon code not found', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Invalid coupon code',
      );
    });

    it('should throw error if coupon is not active', async () => {
      // Arrange
      const inactiveCoupon = { ...createMockCoupon(), status: CouponStatus.INACTIVE };
      mockCouponRepo.findOne.mockResolvedValue(inactiveCoupon);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Coupon is not active',
      );
    });

    it('should throw error if coupon is expired', async () => {
      // Arrange
      const expiredCoupon = {
        ...createMockCoupon(),
        validUntil: new Date('2023-01-01'),
      };
      mockCouponRepo.findOne.mockResolvedValue(expiredCoupon);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Coupon has expired',
      );
    });

    it('should throw error if coupon is not yet valid', async () => {
      // Arrange
      const futureCoupon = {
        ...createMockCoupon(),
        validFrom: new Date('2027-01-01'),
      };
      mockCouponRepo.findOne.mockResolvedValue(futureCoupon);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Coupon is not yet valid',
      );
    });

    it('should throw error if usage limit exceeded', async () => {
      // Arrange
      const exhaustedCoupon = { ...createMockCoupon(), usedCount: 100, maxUses: 100 };
      mockCouponRepo.findOne.mockResolvedValue(exhaustedCoupon);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Coupon usage limit exceeded',
      );
    });

    it('should throw error if order amount below minimum', async () => {
      // Arrange
      const minOrderCoupon = { ...createMockCoupon(), minOrderAmount: 1000 };
      mockCouponRepo.findOne.mockResolvedValue(minOrderCoupon);

      // Act & Assert
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateCoupon(validateDto)).rejects.toThrow(
        'Minimum order amount for this coupon is 1000',
      );
    });

    it('should apply max discount cap when exceeded', async () => {
      // Arrange
      const cappedCoupon = { ...createMockCoupon(), maxDiscountAmount: 30 };
      mockCouponRepo.findOne.mockResolvedValue(cappedCoupon);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(result.discountAmount).toBe(30);
      expect(result.finalAmount).toBe(470);
    });

    it('should cap discount at order amount', async () => {
      // Arrange
      const largeDiscountCoupon = {
        ...createMockCoupon(),
        discountValue: 1000,
        type: CouponType.FIXED,
        maxDiscountAmount: null,
      };
      mockCouponRepo.findOne.mockResolvedValue(largeDiscountCoupon);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(result.discountAmount).toBe(500);
      expect(result.finalAmount).toBe(0);
    });

    it('should handle zero order amount', async () => {
      // Arrange
      const zeroOrderDto: ValidateCouponDto = { code: 'SAVE20', orderAmount: 0 };
      const couponWithoutMin = { ...createMockCoupon(), minOrderAmount: null };
      mockCouponRepo.findOne.mockResolvedValue(couponWithoutMin);

      // Act
      const result = await service.validateCoupon(zeroOrderDto);

      // Assert
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(0);
    });

    it('should handle coupon without minOrderAmount', async () => {
      // Arrange
      const noMinCoupon = { ...createMockCoupon(), minOrderAmount: null };
      mockCouponRepo.findOne.mockResolvedValue(noMinCoupon);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should handle coupon without maxDiscountAmount', async () => {
      // Arrange
      const noMaxCoupon = { ...createMockCoupon(), maxDiscountAmount: null };
      mockCouponRepo.findOne.mockResolvedValue(noMaxCoupon);

      // Act
      const result = await service.validateCoupon(validateDto);

      // Assert
      expect(result.discountAmount).toBe(100);
    });

    it('should handle empty coupon code', async () => {
      // Arrange
      const emptyCodeDto: ValidateCouponDto = { code: '', orderAmount: 500 };
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateCoupon(emptyCodeDto)).rejects.toThrow(
        'Invalid coupon code',
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count successfully', async () => {
      // Arrange
      const coupon = createMockCoupon();
      mockCouponRepo.findOne.mockResolvedValue(coupon);
      mockCouponRepo.save.mockResolvedValue(coupon);

      // Act
      const result = await service.incrementUsage('coupon-123');

      // Assert
      expect(mockCouponRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'coupon-123' },
      });
      expect(mockCouponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedCount: 6,
        }),
      );
      expect(result).toMatchObject({
        id: 'coupon-123',
        code: 'SAVE20',
      });
    });

    it('should set status to INACTIVE when usage limit reached', async () => {
      // Arrange
      const almostFullCoupon = { ...createMockCoupon(), usedCount: 99, maxUses: 100 };
      mockCouponRepo.findOne.mockResolvedValue(almostFullCoupon);
      mockCouponRepo.save.mockResolvedValue(almostFullCoupon);

      // Act
      await service.incrementUsage('coupon-123');

      // Assert
      expect(mockCouponRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usedCount: 100,
          status: CouponStatus.INACTIVE,
        }),
      );
    });

    it('should throw NotFoundException when coupon not found', async () => {
      // Arrange
      mockCouponRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.incrementUsage('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle multiple increments', async () => {
      // Arrange
      const coupon = { ...createMockCoupon(), usedCount: 0 };
      mockCouponRepo.findOne.mockResolvedValue(coupon);
      mockCouponRepo.save.mockResolvedValue(coupon);

      // Act
      await service.incrementUsage('coupon-123');
      await service.incrementUsage('coupon-123');
      await service.incrementUsage('coupon-123');

      // Assert
      expect(mockCouponRepo.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          usedCount: 3,
        }),
      );
    });
  });
});
