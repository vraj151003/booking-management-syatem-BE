import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking-dto';
import { LockSeatsDto } from './dto/lock-seats-dto';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    lockSeats: jest.fn(),
    createBooking: jest.fn(),
    findAllBookings: jest.fn(),
    findOneBooking: jest.fn(),
    findBookingsByUser: jest.fn(),
    findBookingsByTheaterOwner: jest.fn(),
    cancelBooking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);

    jest.clearAllMocks();
  });

  describe('lockSeats', () => {
    const mockLockSeatsDto: LockSeatsDto = {
      showId: 'show-123',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123',
    };

    it('should lock seats successfully', async () => {
      // Arrange
      mockBookingService.lockSeats.mockResolvedValue({
        message: 'Seats locked for 5 minutes',
      });

      // Act
      const result = await controller.lockSeats(mockLockSeatsDto);

      // Assert
      expect(result.message).toBe('Seats locked for 5 minutes');
      expect(service.lockSeats).toHaveBeenCalledWith(
        mockLockSeatsDto.showId,
        mockLockSeatsDto.seatIds,
        mockLockSeatsDto.userId,
      );
    });

    it('should throw error when locking fails', async () => {
      // Arrange
      mockBookingService.lockSeats.mockRejectedValue(
        new Error('Seat already locked'),
      );

      // Act & Assert
      await expect(controller.lockSeats(mockLockSeatsDto)).rejects.toThrow(
        'Seat already locked',
      );
    });

    it('should handle empty seatIds array', async () => {
      // Arrange
      const emptyDto: LockSeatsDto = {
        ...mockLockSeatsDto,
        seatIds: [],
      };
      mockBookingService.lockSeats.mockResolvedValue({
        message: 'Seats locked for 5 minutes',
      });

      // Act
      const result = await controller.lockSeats(emptyDto);

      // Assert
      expect(result.message).toBe('Seats locked for 5 minutes');
    });

    it('should handle single seat lock', async () => {
      // Arrange
      const singleSeatDto: LockSeatsDto = {
        ...mockLockSeatsDto,
        seatIds: ['seat-1'],
      };
      mockBookingService.lockSeats.mockResolvedValue({
        message: 'Seats locked for 5 minutes',
      });

      // Act
      const result = await controller.lockSeats(singleSeatDto);

      // Assert
      expect(result.message).toBe('Seats locked for 5 minutes');
    });
  });

  describe('create', () => {
    const mockCreateBookingDto: CreateBookingDto = {
      showId: 'show-123',
      seatIds: ['seat-1', 'seat-2'],
      userId: 'user-123',
    };

    const mockBookingResponse = {
      message: 'Payment initiated',
      data: {
        booking: { id: 'booking-123' },
        clientSecret: 'secret-123',
      },
    };

    it('should create booking successfully', async () => {
      // Arrange
      mockBookingService.createBooking.mockResolvedValue(mockBookingResponse);

      // Act
      const result = await controller.create(mockCreateBookingDto);

      // Assert
      expect(result).toEqual(mockBookingResponse);
      expect(service.createBooking).toHaveBeenCalledWith(mockCreateBookingDto);
    });

    it('should throw error when booking creation fails', async () => {
      // Arrange
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Seat not locked'),
      );

      // Act & Assert
      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        'Seat not locked',
      );
    });

    it('should throw NotFoundException when show not found', async () => {
      // Arrange
      mockBookingService.createBooking.mockRejectedValue(
        new NotFoundException('Show Not Found'),
      );

      // Act & Assert
      await expect(controller.create(mockCreateBookingDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty seatIds array', async () => {
      // Arrange
      const emptyDto: CreateBookingDto = {
        ...mockCreateBookingDto,
        seatIds: [],
      };
      mockBookingService.createBooking.mockResolvedValue(mockBookingResponse);

      // Act
      const result = await controller.create(emptyDto);

      // Assert
      expect(result).toEqual(mockBookingResponse);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      const invalidDto: CreateBookingDto = {
        ...mockCreateBookingDto,
        showId: 'not-a-uuid',
      };
      mockBookingService.createBooking.mockRejectedValue(
        new Error('Invalid UUID'),
      );

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow(
        'Invalid UUID',
      );
    });
  });

  describe('findAll', () => {
    const mockBookings = [
      { id: 'booking-1' },
      { id: 'booking-2' },
    ];

    it('should return all bookings', async () => {
      // Arrange
      mockBookingService.findAllBookings.mockResolvedValue({
        message: 'All bookings retrieved successfully',
        data: mockBookings,
      });

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result.message).toBe('All bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(service.findAllBookings).toHaveBeenCalled();
    });

    it('should return empty array when no bookings exist', async () => {
      // Arrange
      mockBookingService.findAllBookings.mockResolvedValue({
        message: 'All bookings retrieved successfully',
        data: [],
      });

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    const mockBooking = {
      id: 'booking-123',
      user: { id: 'user-123' },
    };

    it('should return booking by id', async () => {
      // Arrange
      mockBookingService.findOneBooking.mockResolvedValue({
        message: 'Booking retrieved successfully',
        data: mockBooking,
      });

      // Act
      const result = await controller.findOne('booking-123');

      // Assert
      expect(result.message).toBe('Booking retrieved successfully');
      expect(result.data).toEqual(mockBooking);
      expect(service.findOneBooking).toHaveBeenCalledWith('booking-123');
    });

    it('should throw NotFoundException when booking not found', async () => {
      // Arrange
      mockBookingService.findOneBooking.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      // Act & Assert
      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockBookingService.findOneBooking.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      // Act & Assert
      await expect(controller.findOne('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUser', () => {
    const mockBookings = [
      { id: 'booking-1', user: { id: 'user-123' } },
    ];

    it('should return bookings by user id', async () => {
      // Arrange
      mockBookingService.findBookingsByUser.mockResolvedValue({
        message: 'User bookings retrieved successfully',
        data: mockBookings,
      });

      // Act
      const result = await controller.findByUser('user-123');

      // Assert
      expect(result.message).toBe('User bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(service.findBookingsByUser).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when user has no bookings', async () => {
      // Arrange
      mockBookingService.findBookingsByUser.mockResolvedValue({
        message: 'User bookings retrieved successfully',
        data: [],
      });

      // Act
      const result = await controller.findByUser('user-123');

      // Assert
      expect(result.data).toEqual([]);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockBookingService.findBookingsByUser.mockResolvedValue({
        message: 'User bookings retrieved successfully',
        data: [],
      });

      // Act
      const result = await controller.findByUser('not-a-uuid');

      // Assert
      expect(result.data).toEqual([]);
    });
  });

  describe('findByTheaterOwner', () => {
    const mockBookings = [
      { id: 'booking-1', show: { screen: { theaterOwnerId: 'owner-123' } } },
    ];

    it('should return bookings by theater owner id', async () => {
      // Arrange
      mockBookingService.findBookingsByTheaterOwner.mockResolvedValue({
        message: 'Theater owner bookings retrieved successfully',
        data: mockBookings,
      });

      // Act
      const result = await controller.findByTheaterOwner('owner-123');

      // Assert
      expect(result.message).toBe('Theater owner bookings retrieved successfully');
      expect(result.data).toEqual(mockBookings);
      expect(service.findBookingsByTheaterOwner).toHaveBeenCalledWith('owner-123');
    });

    it('should return empty array when theater owner has no bookings', async () => {
      // Arrange
      mockBookingService.findBookingsByTheaterOwner.mockResolvedValue({
        message: 'Theater owner bookings retrieved successfully',
        data: [],
      });

      // Act
      const result = await controller.findByTheaterOwner('owner-123');

      // Assert
      expect(result.data).toEqual([]);
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockBookingService.findBookingsByTheaterOwner.mockResolvedValue({
        message: 'Theater owner bookings retrieved successfully',
        data: [],
      });

      // Act
      const result = await controller.findByTheaterOwner('not-a-uuid');

      // Assert
      expect(result.data).toEqual([]);
    });
  });

  describe('cancel', () => {
    const mockBooking = {
      id: 'booking-123',
      status: 'CANCELLED',
    };

    it('should cancel booking successfully', async () => {
      // Arrange
      mockBookingService.cancelBooking.mockResolvedValue({
        message: 'Booking cancelled successfully',
        data: mockBooking,
      });

      // Act
      const result = await controller.cancel('booking-123');

      // Assert
      expect(result.message).toBe('Booking cancelled successfully');
      expect(result.data).toEqual(mockBooking);
      expect(service.cancelBooking).toHaveBeenCalledWith('booking-123');
    });

    it('should throw NotFoundException when booking not found', async () => {
      // Arrange
      mockBookingService.cancelBooking.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      // Act & Assert
      await expect(controller.cancel('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockBookingService.cancelBooking.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      // Act & Assert
      await expect(controller.cancel('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
