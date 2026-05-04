import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockTransporter = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock the transporter
    (service as any).transporter = mockTransporter;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email successfully', async () => {
      // Arrange
      const to = 'test@example.com';
      const otp = '123456';
      mockConfigService.get.mockReturnValue('noreply@example.com');
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendOtpEmail(to, otp);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to,
        subject: 'Your OTP Verification Code',
        html: expect.stringContaining(otp),
      });
    });

    it('should use default from address when config is not set', async () => {
      // Arrange
      const to = 'test@example.com';
      const otp = '123456';
      mockConfigService.get.mockReturnValue(undefined);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendOtpEmail(to, otp);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Movie Booking" <noreply@example.com>',
        to,
        subject: 'Your OTP Verification Code',
        html: expect.stringContaining(otp),
      });
    });

    it('should handle sendMail errors', async () => {
      // Arrange
      const to = 'test@example.com';
      const otp = '123456';
      mockTransporter.sendMail.mockRejectedValue(new Error('Mail server error'));

      // Act & Assert
      await expect(service.sendOtpEmail(to, otp)).rejects.toThrow('Mail server error');
    });

    it('should handle empty email address', async () => {
      // Arrange
      const to = '';
      const otp = '123456';
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendOtpEmail(to, otp);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: '' })
      );
    });

    it('should handle empty OTP', async () => {
      // Arrange
      const to = 'test@example.com';
      const otp = '';
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendOtpEmail(to, otp);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('') })
      );
    });
  });

  describe('sendMail', () => {
    it('should send custom email successfully', async () => {
      // Arrange
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };
      mockConfigService.get.mockReturnValue('noreply@example.com');
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendMail(mailOptions);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        ...mailOptions,
      });
    });

    it('should use default from address when config is not set', async () => {
      // Arrange
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };
      mockConfigService.get.mockReturnValue(undefined);
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendMail(mailOptions);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"Movie Booking" <noreply@example.com>',
        ...mailOptions,
      });
    });

    it('should handle sendMail errors', async () => {
      // Arrange
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };
      mockTransporter.sendMail.mockRejectedValue(new Error('Mail server error'));

      // Act & Assert
      await expect(service.sendMail(mailOptions)).rejects.toThrow('Mail server error');
    });

    it('should handle empty mail options', async () => {
      // Arrange
      const mailOptions = {
        to: '',
        subject: '',
        html: '',
      };
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendMail(mailOptions);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should handle HTML with special characters', async () => {
      // Arrange
      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test <Subject>',
        html: '<p>Test & HTML</p>',
      };
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // Act
      await service.sendMail(mailOptions);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<p>Test & HTML</p>' })
      );
    });
  });
});
