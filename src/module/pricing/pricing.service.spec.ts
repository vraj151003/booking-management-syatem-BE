import { Test, TestingModule } from '@nestjs/testing';
import { PricingService, PricingMultiplier, DynamicPricingResult } from './pricing.service';
import { HolidayService } from '../holiday/holiday.service';

describe('PricingService', () => {
  let service: PricingService;
  let holidayService: jest.Mocked<HolidayService>;

  beforeEach(async () => {
    const mockHolidayService = {
      isHoliday: jest.fn(),
      getHolidayByDate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: HolidayService,
          useValue: mockHolidayService,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    holidayService = module.get(HolidayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDynamicPrice', () => {
    describe('Weekday pricing without time', () => {
      it('should apply standard weekday pricing for Monday', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 100,
          multiplier: 1.0,
          reason: 'Standard weekday pricing',
        });
        expect(holidayService.isHoliday).toHaveBeenCalledWith(showDate);
      });

      it('should apply standard weekday pricing for Tuesday', async () => {
        // Arrange
        const basePrice = 150;
        const showDate = '2024-04-30'; // Tuesday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.0);
        expect(result.reason).toBe('Standard weekday pricing');
      });

      it('should apply standard weekday pricing for Wednesday', async () => {
        // Arrange
        const basePrice = 200;
        const showDate = '2024-05-01'; // Wednesday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.0);
        expect(result.reason).toBe('Standard weekday pricing');
      });

      it('should apply standard weekday pricing for Thursday', async () => {
        // Arrange
        const basePrice = 250;
        const showDate = '2024-05-02'; // Thursday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.0);
        expect(result.reason).toBe('Standard weekday pricing');
      });

      it('should apply standard weekday pricing for Friday', async () => {
        // Arrange
        const basePrice = 300;
        const showDate = '2024-05-03'; // Friday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.0);
        expect(result.reason).toBe('Standard weekday pricing');
      });
    });

    describe('Time-based pricing on weekday', () => {
      it('should apply morning pricing (6AM - 12PM)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        const showTime = '09:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 90, // 100 * 1.0 * 0.9
          multiplier: 0.9,
          reason: 'Standard weekday pricing with morning pricing',
        });
      });

      it('should apply afternoon pricing (12PM - 5PM)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        const showTime = '14:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 100, // 100 * 1.0 * 1.0
          multiplier: 1.0,
          reason: 'Standard weekday pricing with afternoon pricing',
        });
      });

      it('should apply evening pricing (5PM - 9PM)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        const showTime = '18:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 115, // 100 * 1.0 * 1.15
          multiplier: 1.15,
          reason: 'Standard weekday pricing with evening pricing',
        });
      });

      it('should apply night pricing (9PM - 6AM)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        const showTime = '22:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 125, // 100 * 1.0 * 1.25
          multiplier: 1.25,
          reason: 'Standard weekday pricing with night pricing',
        });
      });

      it('should apply early morning pricing (midnight - 6AM)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29'; // Monday
        const showTime = '03:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 125, // 100 * 1.0 * 1.25
          multiplier: 1.25,
          reason: 'Standard weekday pricing with night pricing',
        });
      });

      it('should handle boundary time at 6AM (morning)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '06:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(0.9);
        expect(result.reason).toContain('morning');
      });

      it('should handle boundary time at 12PM (afternoon)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '12:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.0);
        expect(result.reason).toContain('afternoon');
      });

      it('should handle boundary time at 5PM (evening)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '17:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.15);
        expect(result.reason).toContain('evening');
      });

      it('should handle boundary time at 9PM (night)', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '21:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.25);
        expect(result.reason).toContain('night');
      });
    });

    describe('Time-based pricing on weekend', () => {
      it('should apply weekend + morning pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-04'; // Saturday
        const showTime = '09:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 108, // 100 * 1.2 * 0.9
          multiplier: 1.08,
          reason: 'Weekend pricing applied with morning pricing',
        });
      });

      it('should apply weekend + afternoon pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-04'; // Saturday
        const showTime = '14:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 120, // 100 * 1.2 * 1.0
          multiplier: 1.2,
          reason: 'Weekend pricing applied with afternoon pricing',
        });
      });

      it('should apply weekend + evening pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-04'; // Saturday
        const showTime = '18:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 138, // 100 * 1.2 * 1.15
          multiplier: 1.38,
          reason: 'Weekend pricing applied with evening pricing',
        });
      });

      it('should apply weekend + night pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-04'; // Saturday
        const showTime = '22:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 150, // 100 * 1.2 * 1.25
          multiplier: 1.5,
          reason: 'Weekend pricing applied with night pricing',
        });
      });
    });

    describe('Time-based pricing on holiday', () => {
      it('should apply holiday + morning pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25';
        const showTime = '09:00';
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 113, // 100 * 1.25 * 0.9
          multiplier: 1.125,
          reason: 'Holiday pricing applied with morning pricing',
        });
      });

      it('should apply holiday + afternoon pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25';
        const showTime = '14:00';
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 125, // 100 * 1.25 * 1.0
          multiplier: 1.25,
          reason: 'Holiday pricing applied with afternoon pricing',
        });
      });

      it('should apply holiday + evening pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25';
        const showTime = '18:00';
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 144, // 100 * 1.25 * 1.15
          multiplier: 1.4375,
          reason: 'Holiday pricing applied with evening pricing',
        });
      });

      it('should apply holiday + night pricing', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25';
        const showTime = '22:00';
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 156, // 100 * 1.25 * 1.25
          multiplier: 1.5625,
          reason: 'Holiday pricing applied with night pricing',
        });
      });
    });

    describe('Weekend pricing without time', () => {
      it('should apply weekend pricing for Saturday', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-04'; // Saturday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 120,
          multiplier: 1.2,
          reason: 'Weekend pricing applied',
        });
      });

      it('should apply weekend pricing for Sunday', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-05-05'; // Sunday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 120,
          multiplier: 1.2,
          reason: 'Weekend pricing applied',
        });
      });

      it('should round adjusted price correctly for weekend', async () => {
        // Arrange
        const basePrice = 99;
        const showDate = '2024-05-04'; // Saturday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(119); // 99 * 1.2 = 118.8, rounded to 119
      });
    });

    describe('Holiday pricing without time', () => {
      it('should apply holiday pricing when date is a holiday', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25'; // Christmas
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result).toEqual({
          originalPrice: 100,
          adjustedPrice: 125,
          multiplier: 1.25,
          reason: 'Holiday pricing applied',
        });
      });

      it('should apply holiday pricing even on weekend when date is a holiday', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-12-25'; // Assuming Christmas falls on Sunday
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.25);
        expect(result.reason).toBe('Holiday pricing applied');
      });

      it('should round adjusted price correctly for holiday', async () => {
        // Arrange
        const basePrice = 99;
        const showDate = '2024-12-25';
        holidayService.isHoliday.mockResolvedValue(true);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(124); // 99 * 1.25 = 123.75, rounded to 124
      });
    });

    describe('Edge cases', () => {
      it('should handle zero base price', async () => {
        // Arrange
        const basePrice = 0;
        const showDate = '2024-04-29';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result).toEqual({
          originalPrice: 0,
          adjustedPrice: 0,
          multiplier: 1.0,
          reason: 'Standard weekday pricing',
        });
      });

      it('should handle very large base price', async () => {
        // Arrange
        const basePrice = 10000;
        const showDate = '2024-05-04'; // Saturday
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(12000);
      });

      it('should handle decimal base price', async () => {
        // Arrange
        const basePrice = 150.5;
        const showDate = '2024-04-29';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(151); // 150.5 * 1.0 = 150.5, rounded to 151
      });

      it('should handle negative base price', async () => {
        // Arrange
        const basePrice = -100;
        const showDate = '2024-04-29';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(-100);
      });

      it('should handle leap year date', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-02-29'; // Leap day
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.multiplier).toBe(1.0); // 2024-02-29 is a Thursday
      });

      it('should handle invalid time format', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = 'invalid-time';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.25); // Invalid time defaults to night (hour becomes 0)
      });

      it('should handle empty time string', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.0); // Empty time skips time-based pricing
      });

      it('should handle time with seconds', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '14:30:45';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.0); // 14:30 is afternoon
      });

      it('should handle time without minutes', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '14';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(1.0); // 14 is afternoon
      });

      it('should handle time with single digit hour', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '2024-04-29';
        const showTime = '9:00';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

        // Assert
        expect(result.multiplier).toBe(0.9); // 9:00 is morning
      });
    });

    describe('Parameter validation', () => {
      it('should handle invalid date string', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = 'invalid-date';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.originalPrice).toBe(100);
        // Invalid date results in NaN for dayOfWeek, so it falls to weekday
        expect(result.multiplier).toBe(1.0);
      });

      it('should handle empty date string', async () => {
        // Arrange
        const basePrice = 100;
        const showDate = '';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.originalPrice).toBe(100);
      });

      it('should handle null base price as 0', async () => {
        // Arrange
        const basePrice = null as any;
        const showDate = '2024-04-29';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBe(0);
      });

      it('should handle undefined base price as NaN', async () => {
        // Arrange
        const basePrice = undefined as any;
        const showDate = '2024-04-29';
        holidayService.isHoliday.mockResolvedValue(false);

        // Act
        const result = await service.calculateDynamicPrice(basePrice, showDate);

        // Assert
        expect(result.adjustedPrice).toBeNaN();
      });
    });
  });

  describe('calculateDynamicPricingForSeats', () => {
    it('should calculate pricing for multiple seat types on weekday', async () => {
      // Arrange
      const basePrices = { GOLD: 300, SILVER: 200, VIP: 500 };
      const showDate = '2024-04-29'; // Monday
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result).toEqual({
        GOLD: { originalPrice: 300, adjustedPrice: 300, multiplier: 1.0, reason: 'Standard weekday pricing' },
        SILVER: { originalPrice: 200, adjustedPrice: 200, multiplier: 1.0, reason: 'Standard weekday pricing' },
        VIP: { originalPrice: 500, adjustedPrice: 500, multiplier: 1.0, reason: 'Standard weekday pricing' },
      });
    });

    it('should calculate pricing for multiple seat types on weekend', async () => {
      // Arrange
      const basePrices = { GOLD: 300, SILVER: 200 };
      const showDate = '2024-05-04'; // Saturday
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result).toEqual({
        GOLD: { originalPrice: 300, adjustedPrice: 360, multiplier: 1.2, reason: 'Weekend pricing applied' },
        SILVER: { originalPrice: 200, adjustedPrice: 240, multiplier: 1.2, reason: 'Weekend pricing applied' },
      });
    });

    it('should calculate pricing for multiple seat types on holiday', async () => {
      // Arrange
      const basePrices = { GOLD: 300, SILVER: 200 };
      const showDate = '2024-12-25';
      holidayService.isHoliday.mockResolvedValue(true);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result).toEqual({
        GOLD: { originalPrice: 300, adjustedPrice: 375, multiplier: 1.25, reason: 'Holiday pricing applied' },
        SILVER: { originalPrice: 200, adjustedPrice: 250, multiplier: 1.25, reason: 'Holiday pricing applied' },
      });
    });

    it('should handle empty base prices object', async () => {
      // Arrange
      const basePrices = {};
      const showDate = '2024-04-29';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result).toEqual({});
      expect(holidayService.isHoliday).not.toHaveBeenCalled();
    });

    it('should handle single seat type', async () => {
      // Arrange
      const basePrices = { GOLD: 300 };
      const showDate = '2024-05-04';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result).toEqual({
        GOLD: { originalPrice: 300, adjustedPrice: 360, multiplier: 1.2, reason: 'Weekend pricing applied' },
      });
    });

    it('should handle seat type with zero price', async () => {
      // Arrange
      const basePrices = { GOLD: 300, FREE: 0 };
      const showDate = '2024-05-04';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result.FREE.adjustedPrice).toBe(0);
    });

    it('should call holiday service once for all seat types', async () => {
      // Arrange
      const basePrices = { GOLD: 300, SILVER: 200, VIP: 500 };
      const showDate = '2024-04-29';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledTimes(3);
    });

    it('should handle seat type with negative price', async () => {
      // Arrange
      const basePrices = { GOLD: 300, DISCOUNT: -50 };
      const showDate = '2024-04-29';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result.DISCOUNT.adjustedPrice).toBe(-50);
    });
  });

  describe('updatePricingMultipliers', () => {
    it('should update weekend multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: 1.5 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(1.5);
      expect(current.holiday).toBe(1.25);
      expect(current.weekday).toBe(1.0);
      expect(current.morning).toBe(0.9);
      expect(current.afternoon).toBe(1.0);
      expect(current.evening).toBe(1.15);
      expect(current.night).toBe(1.25);
    });

    it('should update holiday multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { holiday: 1.5 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.holiday).toBe(1.5);
      expect(current.weekend).toBe(1.2);
      expect(current.weekday).toBe(1.0);
    });

    it('should update weekday multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekday: 0.9 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekday).toBe(0.9);
      expect(current.weekend).toBe(1.2);
      expect(current.holiday).toBe(1.25);
    });

    it('should update morning multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { morning: 0.8 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.morning).toBe(0.8);
      expect(current.afternoon).toBe(1.0);
      expect(current.evening).toBe(1.15);
      expect(current.night).toBe(1.25);
    });

    it('should update afternoon multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { afternoon: 1.1 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.afternoon).toBe(1.1);
    });

    it('should update evening multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { evening: 1.2 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.evening).toBe(1.2);
    });

    it('should update night multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { night: 1.3 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.night).toBe(1.3);
    });

    it('should update all multipliers at once', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = {
        weekend: 1.5,
        holiday: 1.6,
        weekday: 0.9,
        morning: 0.8,
        afternoon: 1.1,
        evening: 1.2,
        night: 1.3,
      };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current).toEqual(newMultipliers);
    });

    it('should not affect other multipliers when updating one', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: 1.5 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(1.5);
      expect(current.holiday).toBe(1.25); // unchanged
      expect(current.weekday).toBe(1.0); // unchanged
      expect(current.morning).toBe(0.9); // unchanged
      expect(current.afternoon).toBe(1.0); // unchanged
      expect(current.evening).toBe(1.15); // unchanged
      expect(current.night).toBe(1.25); // unchanged
    });

    it('should handle empty partial update', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = {};

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current).toEqual({
        weekend: 1.2,
        holiday: 1.25,
        weekday: 1.0,
        morning: 0.9,
        afternoon: 1.0,
        evening: 1.15,
        night: 1.25,
      });
    });

    it('should handle zero multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: 0 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(0);
    });

    it('should handle negative multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: -0.5 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(-0.5);
    });

    it('should handle very large multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: 10 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(10);
    });

    it('should handle decimal multiplier', () => {
      // Arrange
      const newMultipliers: Partial<PricingMultiplier> = { weekend: 1.15 };

      // Act
      service.updatePricingMultipliers(newMultipliers);

      // Assert
      const current = service.getPricingMultipliers();
      expect(current.weekend).toBe(1.15);
    });
  });

  describe('getPricingMultipliers', () => {
    it('should return current pricing multipliers', () => {
      // Act
      const result = service.getPricingMultipliers();

      // Assert
      expect(result).toEqual({
        weekend: 1.2,
        holiday: 1.25,
        weekday: 1.0,
        morning: 0.9,
        afternoon: 1.0,
        evening: 1.15,
        night: 1.25,
      });
    });

    it('should return a copy of multipliers (not reference)', () => {
      // Arrange
      const multipliers1 = service.getPricingMultipliers();

      // Act
      multipliers1.weekend = 999;
      const multipliers2 = service.getPricingMultipliers();

      // Assert
      expect(multipliers2.weekend).toBe(1.2); // Should not be affected
    });

    it('should reflect updated multipliers after update', () => {
      // Arrange
      service.updatePricingMultipliers({ weekend: 1.5 });

      // Act
      const result = service.getPricingMultipliers();

      // Assert
      expect(result.weekend).toBe(1.5);
    });

    it('should return copy after multiple updates', () => {
      // Arrange
      service.updatePricingMultipliers({ weekend: 1.5 });
      service.updatePricingMultipliers({ holiday: 1.6 });

      // Act
      const result = service.getPricingMultipliers();

      // Assert
      expect(result).toEqual({
        weekend: 1.5,
        holiday: 1.6,
        weekday: 1.0,
        morning: 0.9,
        afternoon: 1.0,
        evening: 1.15,
        night: 1.25,
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should use updated multipliers in calculateDynamicPrice', async () => {
      // Arrange
      service.updatePricingMultipliers({ weekend: 2.0 });
      const basePrice = 100;
      const showDate = '2024-05-04'; // Saturday
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPrice(basePrice, showDate);

      // Assert
      expect(result.adjustedPrice).toBe(200);
      expect(result.multiplier).toBe(2.0);
    });

    it('should use updated multipliers in calculateDynamicPricingForSeats', async () => {
      // Arrange
      service.updatePricingMultipliers({ holiday: 2.0 });
      const basePrices = { GOLD: 300 };
      const showDate = '2024-12-25';
      holidayService.isHoliday.mockResolvedValue(true);

      // Act
      const result = await service.calculateDynamicPricingForSeats(basePrices, showDate);

      // Assert
      expect(result.GOLD.adjustedPrice).toBe(600);
      expect(result.GOLD.multiplier).toBe(2.0);
    });

    it('should use updated time multipliers in calculations', async () => {
      // Arrange
      service.updatePricingMultipliers({ evening: 2.0 });
      const basePrice = 100;
      const showDate = '2024-04-29'; // Monday
      const showTime = '18:00';
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

      // Assert
      expect(result.adjustedPrice).toBe(200); // 100 * 1.0 * 2.0
      expect(result.multiplier).toBe(2.0);
    });

    it('should combine date and time multipliers correctly', async () => {
      // Arrange
      const basePrice = 100;
      const showDate = '2024-05-04'; // Saturday
      const showTime = '18:00'; // Evening
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await service.calculateDynamicPrice(basePrice, showDate, showTime);

      // Assert
      expect(result.adjustedPrice).toBe(138); // 100 * 1.2 * 1.15
      expect(result.multiplier).toBe(1.38);
    });
  });
});
