import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BookingService } from './booking.service';
import { Booking } from './entity/booking.entity';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../payment/stripe/stripe.service';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { CouponService } from '../coupon/coupon.service';
import { PricingService } from '../pricing/pricing.service';
import { AuditService } from '../audit/audit.service';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepo: Repository<Booking>;
  let dataSource: DataSource;
  let redisService: RedisService;
  let stripeService: StripeService;
  let paymentService: PaymentService;
  let queryRunner: any;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockBookingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRedisService = {
    getLock: jest.fn(),
    setLock: jest.fn(),
    deleteLock: jest.fn(),
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
  };

  const mockPaymentService = {
    createPayment: jest.fn(),
    markSuccess: jest.fn(),
    markFailed: jest.fn(),
    calculateGST: jest.fn(),
  };

  const mockNotificationService = {
    sendBookingNotifications: jest.fn(),
  };

  const mockCouponService = {
    validateCoupon: jest.fn(),
    incrementUsage: jest.fn(),
  };

  const mockPricingService = {
    calculateDynamicPricingForSeats: jest.fn(),
  };

  const mockAuditService = {
    logAdminAction: jest.fn(),
    logBookingAction: jest.fn(),
    createLog: jest.fn(),
    findAll: jest.fn(),
    findByEntity: jest.fn(),
    findByUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: CouponService,
          useValue: mockCouponService,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepo = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    dataSource = module.get<DataSource>(DataSource);
    redisService = module.get<RedisService>(RedisService);
    stripeService = module.get<StripeService>(StripeService);
    paymentService = module.get<PaymentService>(PaymentService);
    queryRunner = mockQueryRunner;

    // Reset query builder mock
    mockQueryBuilder.getMany.mockResolvedValue([]);
    mockQueryBuilder.leftJoin.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.setLock.mockReturnThis();

    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const mockDto = {
      showId: 'show-123',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123',
    };

    const mockShow = {
      id: 'show-123',
      pricing: { GOLD: 300, SILVER: 200 },
      screen: { id: 'screen-123' },
      isActive: true,
      showDate: '2026-12-01',
      startTime: '18:00',
      endTime: '21:00',
    };

    const mockSeats = [
      { id: 'seat-1', seatType: 'GOLD' },
      { id: 'seat-2', seatType: 'SILVER' },
    ];

    const mockPaymentIntent = {
      id: 'pi-123',
      client_secret: 'secret-123',
    };

    const mockBooking = {
      id: 'booking-123',
      show: mockShow,
      seats: mockSeats,
      totalAmount: 500,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentIntentId: 'pi-123',
      user: { id: 'user-123' },
    };

    it('should create booking successfully when seats are locked', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockSeats).mockResolvedValueOnce([]);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockBooking)
        .mockReturnValueOnce({ id: 'payment-123' });
      mockQueryRunner.manager.save.mockResolvedValue(mockBooking);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPaymentService.calculateGST.mockReturnValue({
        gstRate: 12,
        gstAmount: 36,
        totalAmount: 336,
      });
      mockPricingService.calculateDynamicPricingForSeats.mockResolvedValue({
        GOLD: { originalPrice: 300, adjustedPrice: 300, multiplier: 1, reason: 'Standard weekday pricing' },
        SILVER: { originalPrice: 200, adjustedPrice: 200, multiplier: 1, reason: 'Standard weekday pricing' },
      });

      // Act
      const result = await service.createBooking(mockDto);

      // Assert
      expect(result.message).toBe('Payment initiated');
      expect(result.data.booking).toEqual(mockBooking);
      expect(result.data.clientSecret).toBe('secret-123');
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(336, { type: 'booking' });
      expect(mockPricingService.calculateDynamicPricingForSeats).toHaveBeenCalledWith(mockShow.pricing, mockShow.showDate, mockShow.startTime);
      expect(mockPaymentService.calculateGST).toHaveBeenCalledWith(500);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw error when seat is not locked by user', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow(
        'Seat seat-1 not locked by user',
      );
      expect(mockQueryRunner.connect).not.toHaveBeenCalled();
    });

    it('should throw error when seat is locked by different user', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('different-user');

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow(
        'Seat seat-1 not locked by user',
      );
    });

    it('should throw NotFoundException when show not found', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw error when seats already booked', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockSeats).mockResolvedValueOnce([{ id: 'existing-booking' }]);

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow(
        'Some seat already booked',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should calculate total amount correctly based on seat types', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockSeats).mockResolvedValueOnce([]);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockBooking)
        .mockReturnValueOnce({ id: 'payment-123' });
      mockQueryRunner.manager.save.mockResolvedValue(mockBooking);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPaymentService.calculateGST.mockReturnValue({
        gstRate: 12,
        gstAmount: 60,
        totalAmount: 560,
      });
      mockPricingService.calculateDynamicPricingForSeats.mockResolvedValue({
        GOLD: { originalPrice: 300, adjustedPrice: 300, multiplier: 1, reason: 'Standard weekday pricing' },
        SILVER: { originalPrice: 200, adjustedPrice: 200, multiplier: 1, reason: 'Standard weekday pricing' },
      });

      // Act
      await service.createBooking(mockDto);

      // Assert
      expect(mockPaymentService.calculateGST).toHaveBeenCalledWith(500);
    });

    it('should handle zero pricing for unknown seat type', async () => {
      // Arrange
      const seatsWithUnknownType = [
        { id: 'seat-1', seatType: 'UNKNOWN' },
      ];
      const bookingWithZeroAmount = { ...mockBooking, totalAmount: 0 };
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce(seatsWithUnknownType).mockResolvedValueOnce([]);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(bookingWithZeroAmount)
        .mockReturnValueOnce({ id: 'payment-123' });
      mockQueryRunner.manager.save.mockResolvedValue(bookingWithZeroAmount);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPaymentService.calculateGST.mockReturnValue({
        gstRate: 12,
        gstAmount: 0,
        totalAmount: 0,
      });
      mockPricingService.calculateDynamicPricingForSeats.mockResolvedValue({
        UNKNOWN: { originalPrice: 0, adjustedPrice: 0, multiplier: 1, reason: 'Standard weekday pricing' },
      });

      // Act
      const result = await service.createBooking(mockDto);

      // Assert
      expect(mockPaymentService.calculateGST).toHaveBeenCalledWith(0);
    });

    it('should rollback transaction on error', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow('DB Error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should release query runner even on error', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB Error'));

      // Act & Assert
      await expect(service.createBooking(mockDto)).rejects.toThrow();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should create payment within the same transaction', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce(mockSeats).mockResolvedValueOnce([]);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockBooking)
        .mockReturnValueOnce({ id: 'payment-123' });
      mockQueryRunner.manager.save.mockResolvedValue(mockBooking);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPaymentService.calculateGST.mockReturnValue({
        gstRate: 12,
        gstAmount: 36,
        totalAmount: 336,
      });
      mockPricingService.calculateDynamicPricingForSeats.mockResolvedValue({
        GOLD: { originalPrice: 300, adjustedPrice: 300, multiplier: 1, reason: 'Standard weekday pricing' },
        SILVER: { originalPrice: 200, adjustedPrice: 200, multiplier: 1, reason: 'Standard weekday pricing' },
      });

      // Act
      await service.createBooking(mockDto);

      // Assert
      expect(mockQueryRunner.manager.create).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
    });

    it('should handle empty seatIds array', async () => {
      // Arrange
      const emptyDto = { ...mockDto, seatIds: [] };
      const bookingWithZeroAmount = { ...mockBooking, totalAmount: 0, seats: [] };
      mockRedisService.getLock.mockResolvedValue('user-123');
      mockQueryRunner.manager.findOne.mockResolvedValue(mockShow);
      mockQueryRunner.manager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockQueryRunner.manager.create
        .mockReturnValueOnce(bookingWithZeroAmount)
        .mockReturnValueOnce({ id: 'payment-123' });
      mockQueryRunner.manager.save.mockResolvedValue(bookingWithZeroAmount);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPaymentService.calculateGST.mockReturnValue({
        gstRate: 12,
        gstAmount: 0,
        totalAmount: 0,
      });
      mockPricingService.calculateDynamicPricingForSeats.mockResolvedValue({});

      // Act
      const result = await service.createBooking(emptyDto);

      // Assert
      expect(mockPaymentService.calculateGST).toHaveBeenCalledWith(0);
    });
  });

  describe('confrimBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      paymentIntentId: 'pi-123',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      seats: [{ id: 'seat-1', row: 'A', seatNumber: '1' }],
      show: {
        id: 'show-123',
        showDate: '2024-05-01',
        startTime: '18:00',
        movie: { name: 'Avengers' },
        screen: {
          id: 'screen-123',
          name: 'Screen 1',
          theaterOwner: {
            id: 'owner-123',
            email: 'owner@example.com',
          },
        },
      },
      user: {
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      totalAmount: 450,
    };

    it('should confirm booking successfully', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);
      mockNotificationService.sendBookingNotifications.mockResolvedValue(undefined);

      // Act
      const result = await service.confrimBooking('pi-123');

      // Assert
      expect(result.message).toBe('Booking confirmed');
      expect(result.data).toEqual(mockBooking);
      expect(mockBooking.status).toBe('CONFIRMED');
      expect(mockBooking.paymentStatus).toBe('PAID');
      expect(mockRedisService.deleteLock).toHaveBeenCalledWith(
        'lock:show-123:seat-1',
      );
      expect(mockNotificationService.sendBookingNotifications).toHaveBeenCalledWith({
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        theaterOwnerEmail: 'owner@example.com',
        movieName: 'Avengers',
        showDate: '2024-05-01',
        showTime: '18:00',
        screenName: 'Screen 1',
        seats: ['A1'],
        totalAmount: 450,
        bookingId: 'booking-123',
      }, 'user-123', 'owner-123');
    });

    it('should throw error when booking not found', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.confrimBooking('pi-123')).rejects.toThrow(
        'Booking not found',
      );
      expect(mockNotificationService.sendBookingNotifications).not.toHaveBeenCalled();
    });

    it('should delete locks for all seats', async () => {
      // Arrange
      const multiSeatBooking = {
        ...mockBooking,
        seats: [
          { id: 'seat-1', row: 'A', seatNumber: '1' },
          { id: 'seat-2', row: 'A', seatNumber: '2' },
          { id: 'seat-3', row: 'A', seatNumber: '3' },
        ],
      };
      mockBookingRepo.findOne.mockResolvedValue(multiSeatBooking);
      mockBookingRepo.save.mockResolvedValue(multiSeatBooking);
      mockNotificationService.sendBookingNotifications.mockResolvedValue(undefined);

      // Act
      await service.confrimBooking('pi-123');

      // Assert
      expect(mockRedisService.deleteLock).toHaveBeenCalledTimes(3);
      expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock:show-123:seat-1');
      expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock:show-123:seat-2');
      expect(mockRedisService.deleteLock).toHaveBeenCalledWith('lock:show-123:seat-3');
      expect(mockNotificationService.sendBookingNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          seats: ['A1', 'A2', 'A3'],
        }),
        'user-123',
        'owner-123',
      );
    });

    it('should handle booking with no seats', async () => {
      // Arrange
      const noSeatsBooking = {
        ...mockBooking,
        seats: [],
      };
      mockBookingRepo.findOne.mockResolvedValue(noSeatsBooking);
      mockBookingRepo.save.mockResolvedValue(noSeatsBooking);
      mockNotificationService.sendBookingNotifications.mockResolvedValue(undefined);

      // Act
      await service.confrimBooking('pi-123');

      // Assert
      expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
      expect(mockNotificationService.sendBookingNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          seats: [],
        }),
        'user-123',
        'owner-123',
      );
    });

    it('should handle notification service error gracefully', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);
      mockNotificationService.sendBookingNotifications.mockRejectedValue(
        new Error('Notification failed'),
      );

      // Act
      const result = await service.confrimBooking('pi-123');

      // Assert
      expect(result.message).toBe('Booking confirmed');
      expect(mockBooking.status).toBe('CONFIRMED');
      expect(mockNotificationService.sendBookingNotifications).toHaveBeenCalled();
    });
  });

  describe('lockSeats', () => {
    const mockShowId = 'show-123';
    const mockSeatIds = ['seat-1', 'seat-2'];
    const mockUserId = 'user-123';

    it('should lock seats successfully', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue(null);
      mockRedisService.setLock.mockResolvedValue('OK');

      // Act
      const result = await service.lockSeats(mockShowId, mockSeatIds, mockUserId);

      // Assert
      expect(result.message).toBe('Seats locked for 20 minutes');
      expect(mockRedisService.setLock).toHaveBeenCalledTimes(2);
      expect(mockRedisService.setLock).toHaveBeenCalledWith(
        `lock:${mockShowId}:seat-1`,
        mockUserId,
        1200,
      );
      expect(mockRedisService.setLock).toHaveBeenCalledWith(
        `lock:${mockShowId}:seat-2`,
        mockUserId,
        1200,
      );
    });

    it('should throw error when seat already locked', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue('other-user');

      // Act & Assert
      await expect(
        service.lockSeats(mockShowId, mockSeatIds, mockUserId),
      ).rejects.toThrow('Seat already locked');
    });

    it('should handle single seat lock', async () => {
      // Arrange
      const singleSeat = ['seat-1'];
      mockRedisService.getLock.mockResolvedValue(null);
      mockRedisService.setLock.mockResolvedValue('OK');

      // Act
      await service.lockSeats(mockShowId, singleSeat, mockUserId);

      // Assert
      expect(mockRedisService.setLock).toHaveBeenCalledTimes(1);
    });

    it('should handle empty seatIds array', async () => {
      // Arrange
      const emptySeats: string[] = [];

      // Act
      const result = await service.lockSeats(mockShowId, emptySeats, mockUserId);

      // Assert
      expect(result.message).toBe('Seats locked for 20 minutes');
      expect(mockRedisService.setLock).not.toHaveBeenCalled();
    });

    it('should use correct lock key format', async () => {
      // Arrange
      mockRedisService.getLock.mockResolvedValue(null);
      mockRedisService.setLock.mockResolvedValue('OK');

      // Act
      await service.lockSeats(mockShowId, mockSeatIds, mockUserId);

      // Assert
      expect(mockRedisService.getLock).toHaveBeenCalledWith(
        `lock:${mockShowId}:seat-1`,
      );
    });
  });

  describe('findAllBookings', () => {
    const mockBookings = [
      { id: 'booking-1' },
      { id: 'booking-2' },
    ];

    it('should return all bookings', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBookings),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAllBookings();

      // Assert
      expect(result.message).toBe('Bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(mockBookingRepo.createQueryBuilder).toHaveBeenCalledWith('booking');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('booking.user', 'user');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('booking.show', 'show');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.movie', 'movie');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.screen', 'screen');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('booking.seats', 'seats');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return empty array when no bookings exist', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findAllBookings();

      // Assert
      expect(result.data).toEqual([]);
      expect(mockBookingRepo.createQueryBuilder).toHaveBeenCalledWith('booking');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOneBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      user: { id: 'user-123' },
      show: { id: 'show-123' },
    };

    it('should return booking by id', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);

      // Act
      const result = await service.findOneBooking('booking-123');

      // Assert
      expect(result.message).toBe('Booking retrieved successfully');
      expect(result.data).toEqual(mockBooking);
      expect(mockBookingRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        relations: ['user', 'show', 'show.movie', 'show.screen', 'seats'],
      });
    });

    it('should throw NotFoundException when booking not found', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneBooking('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneBooking('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBookingsByUser', () => {
    const mockBookings = [
      { id: 'booking-1', user: { id: 'user-123' } },
    ];

    it('should return bookings by user id', async () => {
      // Arrange
      mockBookingRepo.find.mockResolvedValue(mockBookings);

      // Act
      const result = await service.findBookingsByUser('user-123');

      // Assert
      expect(result.message).toBe('User bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(mockBookingRepo.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-123' } },
        relations: ['user', 'show', 'show.movie', 'show.screen', 'seats'],
      });
    });

    it('should return empty array when user has no bookings', async () => {
      // Arrange
      mockBookingRepo.find.mockResolvedValue([]);

      // Act
      const result = await service.findBookingsByUser('user-123');

      // Assert
      expect(result.data).toEqual([]);
    });
  });

  describe('findBookingsByTheaterOwner', () => {
    const mockBookings = [
      { id: 'booking-1', show: { screen: { theaterOwnerId: 'owner-123' } } },
    ];

    it('should return bookings by theater owner id', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBookings),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findBookingsByTheaterOwner('owner-123');

      // Assert
      expect(result.message).toBe('Theater owner bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'screen.theaterOwnerId = :theaterOwnerId',
        { theaterOwnerId: 'owner-123' },
      );
    });

    it('should return empty array when theater owner has no bookings', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findBookingsByTheaterOwner('owner-123');

      // Assert
      expect(result.data).toEqual([]);
    });

    it('should join all required relations', async () => {
      // Arrange
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      // Act
      await service.findBookingsByTheaterOwner('owner-123');

      // Assert
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'booking.user',
        'user',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'booking.show',
        'show',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'show.movie',
        'movie',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'show.screen',
        'screen',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'booking.seats',
        'seats',
      );
    });
  });

  describe('cancelBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      status: 'PENDING',
    };

    it('should cancel booking successfully', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);

      // Act
      const result = await service.cancelBooking('booking-123');

      // Assert
      expect(result.message).toBe('Booking cancelled successfully');
      expect(result.data).toEqual(mockBooking);
      expect(mockBooking.status).toBe('CANCELLED');
      expect(mockBookingRepo.save).toHaveBeenCalledWith(mockBooking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.cancelBooking('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle already cancelled booking', async () => {
      // Arrange
      const cancelledBooking = { ...mockBooking, status: 'CANCELLED' };
      mockBookingRepo.findOne.mockResolvedValue(cancelledBooking);
      mockBookingRepo.save.mockResolvedValue(cancelledBooking);

      // Act
      const result = await service.cancelBooking('booking-123');

      // Assert
      expect(result.data.status).toBe('CANCELLED');
    });
  });

  describe('failBooking', () => {
    const mockBooking = {
      id: 'booking-123',
      paymentIntentId: 'pi-123',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      seats: [{ id: 'seat-1' }],
      show: { id: 'show-123' },
    };

    it('should fail booking and release locks', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(mockBooking);
      mockBookingRepo.save.mockResolvedValue(mockBooking);

      // Act
      const result = await service.failBooking('pi-123');

      // Assert
      expect(result?.message).toBe('Booking marked as failed and locks released');
      expect(mockBooking.status).toBe('CANCELLED');
      expect(mockBooking.paymentStatus).toBe('FAILED');
      expect(mockRedisService.deleteLock).toHaveBeenCalledWith(
        'lock:show-123:seat-1',
      );
    });

    it('should throw NotFoundException when booking not found', async () => {
      // Arrange
      mockBookingRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.failBooking('pi-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return early if booking is already confirmed', async () => {
      // Arrange
      const confirmedBooking = { ...mockBooking, status: 'CONFIRMED' };
      mockBookingRepo.findOne.mockResolvedValue(confirmedBooking);

      // Act
      await service.failBooking('pi-123');

      // Assert
      expect(mockBookingRepo.save).not.toHaveBeenCalled();
      expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
    });

    it('should delete locks for all seats on failure', async () => {
      // Arrange
      const multiSeatBooking = {
        ...mockBooking,
        seats: [
          { id: 'seat-1' },
          { id: 'seat-2' },
        ],
      };
      mockBookingRepo.findOne.mockResolvedValue(multiSeatBooking);
      mockBookingRepo.save.mockResolvedValue(multiSeatBooking);

      // Act
      await service.failBooking('pi-123');

      // Assert
      expect(mockRedisService.deleteLock).toHaveBeenCalledTimes(2);
    });

    it('should handle booking with no seats on failure', async () => {
      // Arrange
      const noSeatsBooking = {
        ...mockBooking,
        seats: [],
      };
      mockBookingRepo.findOne.mockResolvedValue(noSeatsBooking);
      mockBookingRepo.save.mockResolvedValue(noSeatsBooking);

      // Act
      await service.failBooking('pi-123');

      // Assert
      expect(mockRedisService.deleteLock).not.toHaveBeenCalled();
    });
  });
});
