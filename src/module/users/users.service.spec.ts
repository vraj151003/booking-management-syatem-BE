import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { User } from './entity/user.entity';
import { Role } from '../role/entity/role.entity';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let mailService: MailService;
  let otpService: OtpService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepo = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendOtpEmail: jest.fn(),
  };

  const mockOtpService = {
    createOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepo,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepo = module.get<Repository<Role>>(getRepositoryToken(Role));
    mailService = module.get<MailService>(MailService);
    otpService = module.get<OtpService>(OtpService);

    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  describe('registerUser', () => {
    const mockUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobileNumber: '1234567890',
      password: 'Password123',
    };

    const mockRole = { id: 1, name: 'CUSTOMER' };
    const mockSavedUser = {
      id: 'user-123',
      ...mockUserData,
      password: 'hashed_password',
      role: mockRole,
    };

    it('should register user successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.registerUser(mockUserData);

      // Assert
      expect(result).toEqual(mockSavedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockOtpService.createOtp).toHaveBeenCalledWith(mockSavedUser);
      expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith('john@example.com', '123456');
    });

    it('should throw BadRequestException when user already exists by email', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing-user' });

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: [
          { email: mockUserData.email },
          { mobileNumber: mockUserData.mobileNumber },
        ],
      });
    });

    it('should throw BadRequestException when user already exists by mobile', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing-user' });

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user save returns array without ID', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue([]);

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow(
        'Failed to create user - ID not generated',
      );
    });

    it('should throw BadRequestException when user save returns null', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow(
        'Failed to create user - ID not generated',
      );
    });

    it('should handle user save returning array with valid user', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue([mockSavedUser]);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.registerUser(mockUserData);

      // Assert
      expect(result).toEqual(mockSavedUser);
    });

    it('should throw error when bcrypt hash fails', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow('Hash error');
    });

    it('should throw error when OTP creation fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockOtpService.createOtp.mockRejectedValue(new Error('OTP error'));

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow('OTP error');
    });

    it('should throw error when email sending fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockUserData);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockRejectedValue(new Error('Email error'));

      // Act & Assert
      await expect(service.registerUser(mockUserData)).rejects.toThrow('Email error');
    });
  });

  describe('registerTheaterOwner', () => {
    const mockTheaterOwnerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobileNumber: '1234567890',
      password: 'Password123',
      theatreName: 'Grand Cinema',
      businessType: 'Multiplex',
    };

    const mockRole = { id: 2, name: 'THEATRE OWNER' };
    const mockSavedUser = {
      id: 'user-123',
      ...mockTheaterOwnerData,
      password: 'hashed_password',
      role: mockRole,
    };

    it('should register theater owner successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockTheaterOwnerData);
      mockUserRepo.save.mockResolvedValue(mockSavedUser);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.registerTheaterOwner(mockTheaterOwnerData);

      // Assert
      expect(result).toEqual(mockSavedUser);
      expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: 'THEATRE OWNER' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
    });

    it('should throw BadRequestException when theater owner already exists', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue({ id: 'existing-user' });

      // Act & Assert
      await expect(service.registerTheaterOwner(mockTheaterOwnerData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when save fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);
      mockRoleRepo.findOne.mockResolvedValue(mockRole);
      mockUserRepo.create.mockReturnValue(mockTheaterOwnerData);
      mockUserRepo.save.mockResolvedValue(null);

      // Act & Assert
      await expect(service.registerTheaterOwner(mockTheaterOwnerData)).rejects.toThrow(
        'Failed to create user - ID not generated',
      );
    });
  });

  describe('verifyOtp', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      isVerified: false,
    };

    it('should verify OTP successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockUserRepo.save.mockResolvedValue({ ...mockUser, isVerified: true });

      // Act
      const result = await service.verifyOtp('john@example.com', '123456');

      // Assert
      expect(result.isVerified).toBe(true);
      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith('user-123', '123456');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyOtp('john@example.com', '123456')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when OTP verification fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockRejectedValue(new Error('Invalid OTP'));

      // Act & Assert
      await expect(service.verifyOtp('john@example.com', '123456')).rejects.toThrow(
        'Invalid OTP',
      );
    });

    it('should throw error when save fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockUserRepo.save.mockRejectedValue(new Error('Save error'));

      // Act & Assert
      await expect(service.verifyOtp('john@example.com', '123456')).rejects.toThrow(
        'Save error',
      );
    });
  });

  describe('getUserById', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      role: { id: 1, name: 'CUSTOMER' },
    };

    it('should get user by id successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserById('user-123');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['role'],
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserById('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('forgotPassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
    };

    it('should send OTP for password reset successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword('john@example.com');

      // Assert
      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(mockOtpService.createOtp).toHaveBeenCalledWith(mockUser);
      expect(mockMailService.sendOtpEmail).toHaveBeenCalledWith('john@example.com', '123456');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.forgotPassword('john@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when OTP creation fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.createOtp.mockRejectedValue(new Error('OTP error'));

      // Act & Assert
      await expect(service.forgotPassword('john@example.com')).rejects.toThrow('OTP error');
    });

    it('should throw error when email sending fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.createOtp.mockResolvedValue('123456');
      mockMailService.sendOtpEmail.mockRejectedValue(new Error('Email error'));

      // Act & Assert
      await expect(service.forgotPassword('john@example.com')).rejects.toThrow('Email error');
    });
  });

  describe('resetPassword', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      password: 'old_hashed_password',
    };

    it('should reset password successfully', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockUserRepo.save.mockResolvedValue({ ...mockUser, password: 'new_hashed_password' });

      // Act
      const result = await service.resetPassword(
        'john@example.com',
        '123456',
        'NewPassword123',
        'NewPassword123',
      );

      // Assert
      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'NewPassword123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'DifferentPassword'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when OTP verification fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockRejectedValue(new Error('Invalid OTP'));

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'NewPassword123'),
      ).rejects.toThrow('Invalid OTP');
    });

    it('should throw error when bcrypt hash fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'NewPassword123'),
      ).rejects.toThrow('Hash error');
    });

    it('should throw error when save fails', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(undefined);
      mockUserRepo.save.mockRejectedValue(new Error('Save error'));

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'NewPassword123'),
      ).rejects.toThrow('Save error');
    });

    it('should handle case-sensitive password comparison', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.resetPassword('john@example.com', '123456', 'NewPassword123', 'newpassword123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
