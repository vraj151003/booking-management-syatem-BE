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
import { User } from '../users/entity/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('FirebaseService - Simple Integration Test', () => {
  let service: FirebaseService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn()
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
        }),
      getOrThrow: jest.fn(),
      set: jest.fn(),
      setEnvFilePaths: jest.fn(),
      changes$: {
        subscribe: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return false when not configured', () => {
    mockConfigService.get.mockReturnValue('');

    const testService = new FirebaseService(mockConfigService, {} as any);
    expect(testService.isConfigured()).toBe(false);
  });

  it('should return true when configured', () => {
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

    const testService = new FirebaseService(mockConfigService, {} as any);
    expect(testService.isConfigured()).toBe(true);
  });

  it('should handle push notification with valid tokens', async () => {
    mockConfigService.get
      .mockReturnValueOnce('test-project-id')
      .mockReturnValueOnce('test-client-email')
      .mockReturnValueOnce('test-private-key');

    // Mock Firebase admin messaging
    const mockSendEachForMulticast = jest.fn().mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [
        { success: true },
        { success: true },
      ],
    });

    // Mock firebase-admin module
    jest.doMock('firebase-admin', () => ({
      initializeApp: jest.fn(),
      credential: {
        cert: jest.fn(),
      },
      messaging: jest.fn(() => ({
        sendEachForMulticast: mockSendEachForMulticast,
      })),
    }));

    // Clear module cache to ensure fresh mock
    jest.resetModules();
    
    const { FirebaseService } = require('./firebase.service');
    const testService = new FirebaseService(mockConfigService, {} as any);

    const result = await testService.sendPushNotification(['token1', 'token2'], {
      title: 'Test',
      body: 'Test message',
    });

    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toEqual([]);
  });
});
