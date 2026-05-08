// Mock firebase-admin at the top level before imports
const mockSendEachForMulticast = jest.fn();

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  messaging: jest.fn(() => ({
    sendEachForMulticast: mockSendEachForMulticast,
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from './firebase.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { DeviceToken } from './entity/device-token.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';

describe('FirebaseService', () => {
  let service: FirebaseService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockUserRepo: jest.Mocked<Repository<User>>;
  let mockDeviceTokenRepo: jest.Mocked<Repository<DeviceToken>>;

  beforeEach(async () => {
    const mockUser = {
      id: 'user-123',
      deviceTokens: [],
    } as any;

    mockConfigService = {
      get: jest.fn(),
      changes$: {
        subscribe: jest.fn(),
      },
      getOrThrow: jest.fn(),
      set: jest.fn(),
      setEnvFilePaths: jest.fn(),
    } as any;

    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockDeviceTokenRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(DeviceToken),
          useValue: mockDeviceTokenRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
    
    // Set up Firebase credentials for all tests
    mockConfigService.get
      .mockImplementation((key: string) => {
        switch (key) {
          case 'FIREBASE_PROJECT_ID':
            return 'test-project-id';
          case 'FIREBASE_CLIENT_EMAIL':
            return 'test-client-email';
          case 'FIREBASE_PRIVATE_KEY':
            return 'test-private-key';
          default:
            return '';
        }
      });
    
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with valid Firebase credentials', () => {
      mockConfigService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-client-email')
        .mockReturnValueOnce('test-private-key');

      const testService = new FirebaseService(mockConfigService, mockUserRepo);

      expect(testService.isConfigured()).toBe(true);
    });

    it('should not initialize with missing Firebase credentials', () => {
      mockConfigService.get.mockReturnValue('');

      const testService = new FirebaseService(mockConfigService, mockUserRepo);

      expect(testService.isConfigured()).toBe(false);
    });
  });

  describe('sendPushNotification', () => {
    beforeEach(() => {
      mockConfigService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-client-email')
        .mockReturnValueOnce('test-private-key');

      const testService = new FirebaseService(mockConfigService, mockUserRepo,);
      service = testService;
    });

    it('should skip sending when Firebase is not configured', async () => {
      mockConfigService.get.mockReturnValue('');

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotification(['token1', 'token2'], {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 0,
        failed: 2,
        errors: [],
      });
    });

    it('should send push notification successfully', async () => {
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true },
          { success: true },
        ],
      });

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotification(['token1', 'token2'], {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 2,
        failed: 0,
        errors: [],
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: 'Test',
          body: 'Test message',
        },
        data: {},
        tokens: ['token1', 'token2'],
      });
    });

    it('should handle Firebase errors gracefully', async () => {
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 2,
        responses: [
          { success: false, error: 'Invalid token' },
          { success: false, error: 'Invalid token' },
        ],
      });

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotification(['token1', 'token2'], {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 0,
        failed: 2,
        errors: ['Invalid token', 'Invalid token'],
      });
    });
  });

  describe('sendPushNotificationToUser', () => {
    beforeEach(() => {
      mockConfigService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-client-email')
        .mockReturnValueOnce('test-private-key');

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;
    });

    it('should send push notification to user with active tokens', async () => {
      const mockDeviceTokens = [
        { id: 'token-1', token: 'token1', deviceType: 'ios', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'token-2', token: 'token2', deviceType: 'android', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: mockDeviceTokens,
      } as any);

      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true },
          { success: true },
        ],
      });

      // Use the global mock for firebase-admin

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotificationToUser('user-123', {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 2,
        failed: 0,
        errors: [],
      });

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['deviceTokens'],
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: 'Test',
          body: 'Test message',
        },
        data: {},
        tokens: ['token1', 'token2'],
      });
    });

    it('should return empty result when user has no device tokens', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: [],
      } as any);

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotificationToUser('user-123', {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 0,
        failed: 0,
        errors: [],
      });

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['deviceTokens'],
      });
    });

    it('should filter only active tokens', async () => {
      const mockDeviceTokens = [
        { id: 'token-1', token: 'token1', deviceType: 'ios', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 'token-2', token: 'token2', deviceType: 'android', isActive: false, createdAt: new Date(), updatedAt: new Date() }, // Inactive
        { id: 'token-3', token: 'token3', deviceType: 'ios', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ];

      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: mockDeviceTokens,
      } as any);

      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true },
          { success: true },
        ],
      });

      // Use the global mock for firebase-admin

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      const result = await service.sendPushNotificationToUser('user-123', {
        title: 'Test',
        body: 'Test message',
      });

      expect(result).toEqual({
        success: 2,
        failed: 0,
        errors: [],
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: 'Test',
          body: 'Test message',
        },
        data: {},
        tokens: ['token1', 'token3'], // Only active tokens
      });
    });
  });

  describe('sendBookingConfirmationToCustomer', () => {
    beforeEach(() => {
      mockConfigService.get
        .mockImplementation((key: string) => {
          switch (key) {
            case 'FIREBASE_PROJECT_ID':
              return 'test-project-id';
            case 'FIREBASE_CLIENT_EMAIL':
              return 'test-client-email';
            case 'FIREBASE_PRIVATE_KEY':
              return 'test-private-key';
            default:
              return '';
          }
        });

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;
    });

    it('should send booking confirmation push notification', async () => {
      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [
          { success: true },
        ],
      });

      // Mock user repository to return user with device tokens
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: [
          { token: 'token1', isActive: true },
        ],
      } as any);

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      await service.sendBookingConfirmationToCustomer('user-123', {
        bookingId: 'booking-123',
        movieName: 'Test Movie',
        showDate: '2023-12-01',
        showTime: '18:00',
        screenName: 'Screen 1',
        seats: ['A1', 'A2'],
        totalAmount: 500,
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: '🎬 Booking Confirmed!',
          body: 'Your booking for Test Movie is confirmed. 2 seat(s) booked for 2023-12-01 at 18:00.',
          imageUrl: undefined,
        },
        data: {
          type: 'booking_confirmed',
          bookingId: 'booking-123',
          movieName: 'Test Movie',
          showDate: '2023-12-01',
          showTime: '18:00',
          screenName: 'Screen 1',
          seats: JSON.stringify(['A1', 'A2']),
          totalAmount: '500',
        },
        tokens: ['token1'],
      });
    });
  });

  describe('sendBookingNotificationToTheaterOwner', () => {
    beforeEach(() => {
      mockConfigService.get
        .mockImplementation((key: string) => {
          switch (key) {
            case 'FIREBASE_PROJECT_ID':
              return 'test-project-id';
            case 'FIREBASE_CLIENT_EMAIL':
              return 'test-client-email';
            case 'FIREBASE_PRIVATE_KEY':
              return 'test-private-key';
            default:
              return '';
          }
        });

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;
    });

    it('should send push notification to user successfully', async () => {
      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 2,
        failureCount: 0,
        responses: [
          { success: true },
          { success: true },
        ],
      });

      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: [
          { token: 'token1', isActive: true },
          { token: 'token2', isActive: true },
        ],
      } as any);

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      await service.sendBookingNotificationToTheaterOwner('owner-123', {
        bookingId: 'booking-123',
        movieName: 'Test Movie',
        showDate: '2023-12-01',
        showTime: '18:00',
        screenName: 'Screen 1',
        seats: ['A1', 'A2'],
        totalAmount: 500,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: '🎟 New Booking Received',
          body: 'John Doe booked 2 seat(s) for Test Movie on 2023-12-01 at 18:00.',
          imageUrl: undefined,
        },
        data: {
          type: 'new_booking',
          bookingId: 'booking-123',
          movieName: 'Test Movie',
          showDate: '2023-12-01',
          showTime: '18:00',
          screenName: 'Screen 1',
          seats: JSON.stringify(['A1', 'A2']),
          totalAmount: '500',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
        },
        tokens: ['token1', 'token2'],
      });
    });
  });

  describe('sendPaymentNotification', () => {
    beforeEach(() => {
      mockConfigService.get
        .mockImplementation((key: string) => {
          switch (key) {
            case 'FIREBASE_PROJECT_ID':
              return 'test-project-id';
            case 'FIREBASE_CLIENT_EMAIL':
              return 'test-client-email';
            case 'FIREBASE_PRIVATE_KEY':
              return 'test-private-key';
            default:
              return '';
          }
        });

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;
    });

    it('should send payment success notification', async () => {
      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [
          { success: true },
        ],
      });

      // Mock user repository to return user with device tokens
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: [
          { token: 'token1', isActive: true },
        ],
      } as any);

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      await service.sendPaymentNotification('user-123', {
        paymentId: 'payment-123',
        amount: 500,
        status: 'success',
        movieName: 'Test Movie',
        bookingId: 'booking-123',
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: '💳 Payment Successful',
          body: 'Payment of ₹500 processed successfully for Test Movie.',
          imageUrl: undefined,
        },
        data: {
          type: 'payment_status',
          paymentId: 'payment-123',
          status: 'success',
          amount: '500',
          movieName: 'Test Movie',
          bookingId: 'booking-123',
        },
        tokens: ['token1'],
      });
    });

    it('should send payment failure notification', async () => {
      // Using global mockSendEachForMulticast variable
      mockSendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [
          { success: true },
        ],
      });

      // Mock user repository to return user with device tokens
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-123',
        deviceTokens: [
          { token: 'token1', isActive: true },
        ],
      } as any);

      const testService = new FirebaseService(mockConfigService, mockUserRepo);
      service = testService;

      await service.sendPaymentNotification('user-123', {
        paymentId: 'payment-123',
        amount: 500,
        status: 'failed',
        movieName: 'Test Movie',
        bookingId: 'booking-123',
      });

      expect(mockSendEachForMulticast).toHaveBeenCalledWith({
        notification: {
          title: '❌ Payment Failed',
          body: 'Payment of ₹500 failed for Test Movie. Please try again.',
          imageUrl: undefined,
        },
        data: {
          type: 'payment_status',
          paymentId: 'payment-123',
          status: 'failed',
          amount: '500',
          movieName: 'Test Movie',
          bookingId: 'booking-123',
        },
        tokens: ['token1'],
      });
    });
  });
});
