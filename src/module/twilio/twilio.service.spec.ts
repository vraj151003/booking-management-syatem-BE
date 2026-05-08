import { Test, TestingModule } from '@nestjs/testing';
import { TwilioService } from './twilio.service';
import { ConfigService } from '@nestjs/config';

// Mock Twilio at the top level
const mockTwilioClient = {
  messages: {
    create: jest.fn().mockResolvedValue({ sid: 'test-sid' }),
  },
};

jest.mock('twilio', () => {
  return jest.fn().mockReturnValue(mockTwilioClient);
});

describe('TwilioService', () => {
  let service: TwilioService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockTwilio: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TwilioService>(TwilioService);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with empty config values', () => {
      mockConfigService.get.mockReturnValue('');
      const testService = new TwilioService(mockConfigService);
      expect(testService.isConfigured()).toBe(false);
    });

    it('should initialize with valid config values', () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      expect(testService.isConfigured()).toBe(true);
    });
  });

  describe('isConfigured', () => {
    it('should return false when any config is missing', () => {
      mockConfigService.get.mockReturnValue('');
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when account SID is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'TWILIO_ACCOUNT_SID') return '';
        return 'valid_value';
      });
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when auth token is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'TWILIO_AUTH_TOKEN') return '';
        return 'valid_value';
      });
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when from number is missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'TWILIO_FROM_NUMBER') return '';
        return 'valid_value';
      });
      expect(service.isConfigured()).toBe(false);
    });

    it('should return true when all configs are present', () => {
      mockConfigService.get.mockReturnValue('valid_value');
      const testService = new TwilioService(mockConfigService);
      expect(testService.isConfigured()).toBe(true);
    });
  });

  describe('sendSms', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('valid_config');
    });

    it('should skip SMS when not configured', async () => {
      mockConfigService.get.mockReturnValue('');
      const testService = new TwilioService(mockConfigService);
      const loggerSpy = jest.spyOn(testService['logger'], 'warn').mockImplementation();
      
      await testService.sendSms('+1234567890', 'test message');
      
      expect(loggerSpy).toHaveBeenCalledWith('Twilio credentials not configured. Skipping SMS send.');
      loggerSpy.mockRestore();
    });

    it('should send SMS successfully', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendSms('+1234567890', 'test message');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'test message',
        from: 'TWILIO_FROM_NUMBER',
        to: '+1234567890',
      });
    });

    it('should format 10-digit numbers with +91', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendSms('9499780888', 'test message');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'test message',
        from: 'TWILIO_FROM_NUMBER',
        to: '+919499780888',
      });
    });

    it('should handle numbers starting with 0', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendSms('09499780888', 'test message');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'test message',
        from: 'TWILIO_FROM_NUMBER',
        to: '+919499780888',
      });
    });

    it('should handle numbers with 91 prefix', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendSms('919499780888', 'test message');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'test message',
        from: 'TWILIO_FROM_NUMBER',
        to: '+919499780888',
      });
    });

    it('should handle numbers with + prefix', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendSms('+919499780888', 'test message');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'test message',
        from: 'TWILIO_FROM_NUMBER',
        to: '+919499780888',
      });
    });

    it('should throw error when sending to same number', async () => {
      mockConfigService.get.mockReturnValue('valid_config');
      const testService = new TwilioService(mockConfigService);
      
      await expect(testService.sendSms('valid_config', 'test message')).rejects.toThrow(
        'Cannot send SMS to the same number as the sender number'
      );
    });

    it('should handle Twilio API errors', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      // Mock the create method to reject with specific error
      mockTwilioClient.messages.create.mockRejectedValue({ code: 21614 });
      
      await expect(testService.sendSms('+1234567890', 'test message')).rejects.toThrow(
        'Mobile number is not a valid number or not reachable'
      );
    });

    it('should handle same number error (21266)', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      // Mock the create method to reject with specific error
      mockTwilioClient.messages.create.mockRejectedValue({ code: 21266 });
      
      await expect(testService.sendSms('+1234567890', 'test message')).rejects.toThrow(
        'Cannot send SMS to the same number as the Twilio sender number'
      );
    });

    it('should handle invalid Twilio number error (21659)', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      // Mock the create method to reject with specific error
      mockTwilioClient.messages.create.mockRejectedValue({ code: 21659 });
      
      await expect(testService.sendSms('+1234567890', 'test message')).rejects.toThrow(
        'Twilio sender number is not valid or not configured properly. Please check your TWILIO_FROM_NUMBER environment variable.'
      );
    });

    it('should handle Twilio account error (21612)', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      // Mock the create method to reject with specific error
      mockTwilioClient.messages.create.mockRejectedValue({ code: 21612 });
      
      await expect(testService.sendSms('+1234567890', 'test message')).rejects.toThrow(
        'Twilio account is not configured for SMS. Please check your Twilio account settings.'
      );
    });

    it('should handle generic Twilio errors', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      // Mock the create method to reject with generic error
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Generic error'));
      
      await expect(testService.sendSms('+1234567890', 'test message')).rejects.toThrow(
        'SMS sending failed: Generic error'
      );
    });
  });

  describe('sendOtpSms', () => {
    beforeEach(() => {
      // Reset mock to resolved value
      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'test-sid' });
    });
    
    it('should send OTP message with proper template', async () => {
      mockConfigService.get
        .mockReturnValueOnce('TWILIO_ACCOUNT_SID')
        .mockReturnValueOnce('TWILIO_AUTH_TOKEN')
        .mockReturnValueOnce('TWILIO_FROM_NUMBER');
      
      const testService = new TwilioService(mockConfigService);
      
      await testService.sendOtpSms('+1234567890', '123456');
      
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Your OTP for password reset is: 123456. It will expire in 10 minutes. Please do not share this OTP with anyone.',
        from: 'TWILIO_FROM_NUMBER',
        to: '+1234567890',
      });
    });
  });
});
