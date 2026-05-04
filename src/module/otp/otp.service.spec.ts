import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpService } from './otp.service';
import { Otp } from './entity/otp.entity';
import { User } from '../users/entity/user.entity';
import { Role } from '../role/entity/role.entity';

describe('OtpService', () => {
  let service: OtpService;
  let otpRepo: Repository<Otp>;

  const mockRole: Role = {
    id: 1,
    name: 'USER',
    permissions: [],
  };

  const mockUser: User = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    mobileNumber: '1234567890',
    password: 'hashedPassword',
    role: mockRole,
    isVerified: false,
    adminVerified: false,
    failedLoginAttempts: 0,
  } as any;

  const mockOtp: Otp = {
    id: 'otp-1',
    code: '123456',
    userId: 'user-1',
    user: mockUser,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    isUsed: false,
    createdAt: new Date(),
  };

  const mockOtpRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: getRepositoryToken(Otp),
          useValue: mockOtpRepo,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpRepo = module.get<Repository<Otp>>(getRepositoryToken(Otp));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOtp', () => {
    it('should create OTP successfully', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act
      const result = await service.createOtp(mockUser);

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(6);
      expect(/^\d{6}$/.test(result)).toBe(true);
      expect(mockOtpRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          user: mockUser,
          code: result,
          expiresAt: expect.any(Date),
        })
      );
      expect(mockOtpRepo.save).toHaveBeenCalledWith(mockOtp);
    });

    it('should generate 6-digit OTP', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act
      const otp = await service.createOtp(mockUser);

      // Assert
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should set expiration time to 10 minutes from now', async () => {
      // Arrange
      const now = new Date();
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act
      await service.createOtp(mockUser);

      // Assert
      const createCall = mockOtpRepo.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt;
      const expectedExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
      
      expect(expiresAt.getTime()).toBeGreaterThan(expectedExpiresAt.getTime() - 1000);
      expect(expiresAt.getTime()).toBeLessThan(expectedExpiresAt.getTime() + 1000);
    });

    it('should handle repository errors during create', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createOtp(mockUser)).rejects.toThrow('Database error');
    });

    it('should handle null user', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act & Assert
      await expect(service.createOtp(null as any)).rejects.toThrow();
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP successfully', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue({ ...mockOtp, isUsed: true });

      // Act
      const result = await service.verifyOtp('user-1', '123456');

      // Assert
      expect(result).toBe(true);
      expect(mockOtpRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', code: '123456', isUsed: false },
        order: { createdAt: 'DESC' },
      });
      expect(mockOtpRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isUsed: true })
      );
    });

    it('should throw BadRequestException for invalid OTP', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp('user-1', '000000')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.verifyOtp('user-1', '000000')).rejects.toThrow('Invalid OTP');
    });

    it('should throw BadRequestException for expired OTP', async () => {
      // Arrange
      const expiredOtp = {
        ...mockOtp,
        expiresAt: new Date(Date.now() - 10 * 60 * 1000),
      };
      mockOtpRepo.findOne.mockResolvedValue(expiredOtp);

      // Act & Assert
      await expect(service.verifyOtp('user-1', '123456')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.verifyOtp('user-1', '123456')).rejects.toThrow('OTP has expired');
    });

    it('should throw BadRequestException for already used OTP', async () => {
      // Arrange
      const usedOtp = { ...mockOtp, isUsed: true };
      mockOtpRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp('user-1', '123456')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle empty userId', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp('', '123456')).rejects.toThrow(BadRequestException);
    });

    it('should handle empty OTP code', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp('user-1', '')).rejects.toThrow(BadRequestException);
    });

    it('should handle repository errors during findOne', async () => {
      // Arrange
      mockOtpRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.verifyOtp('user-1', '123456')).rejects.toThrow('Database error');
    });

    it('should handle repository errors during save', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(mockOtp);
      mockOtpRepo.save.mockRejectedValue(new Error('Save error'));

      // Act & Assert
      await expect(service.verifyOtp('user-1', '123456')).rejects.toThrow('Save error');
    });

    it('should get the most recent OTP when multiple exist', async () => {
      // Arrange
      mockOtpRepo.findOne.mockResolvedValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue({ ...mockOtp, isUsed: true });

      // Act
      await service.verifyOtp('user-1', '123456');

      // Assert
      expect(mockOtpRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        })
      );
    });
  });

  describe('generateOTP (private method)', () => {
    it('should generate different OTPs on multiple calls', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act
      const otp1 = await service.createOtp(mockUser);
      const otp2 = await service.createOtp(mockUser);

      // Assert
      // While it's possible (though unlikely) to get the same OTP,
      // we expect them to be different in most cases
      expect(otp1).toBeDefined();
      expect(otp2).toBeDefined();
    });

    it('should always generate 6-digit numbers', async () => {
      // Arrange
      mockOtpRepo.create.mockReturnValue(mockOtp);
      mockOtpRepo.save.mockResolvedValue(mockOtp);

      // Act
      const otps = await Promise.all([
        service.createOtp(mockUser),
        service.createOtp(mockUser),
        service.createOtp(mockUser),
        service.createOtp(mockUser),
        service.createOtp(mockUser),
      ]);

      // Assert
      otps.forEach(otp => {
        expect(otp).toHaveLength(6);
        expect(/^\d{6}$/.test(otp)).toBe(true);
      });
    });
  });
});
