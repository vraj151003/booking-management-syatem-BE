import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/entity/user.entity';
import { Role } from '../role/entity/role.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<User>;
  let jwtService: JwtService;
  const bcrypt = require('bcrypt');

  const mockRole: Role = {
    id: 1,
    name: 'CUSTOMER',
    permissions: [],
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    mobileNumber: '1234567890',
    isVerified: true,
    role: mockRole,
    gender: null as any,
    dateOfBirth: null as any,
    profile: null as any,
    theatreName: null as any,
    businessType: null as any,
    gstNumber: null as any,
    panNumber: null as any,
    address: null as any,
    city: null as any,
    state: null as any,
    pincode: null as any,
    bankName: null as any,
    accountNumber: null as any,
    ifscCode: null as any,
    accountHolderName: null as any,
    idProof: null as any,
    agreementDoc: null as any,
    adminVerified: false,
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    describe('Success cases', () => {
      it('should return access token and user when credentials are valid', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        const result = await service.login('test@example.com', 'password123');

        // Assert
        expect(result).toEqual({
          access_token: 'jwt-token',
          user: mockUser,
        });
        expect(userRepo.findOne).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          relations: ['role'],
        });
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: 'test@example.com',
          sub: 'user-1',
          role: mockRole,
        });
      });

      it('should return access token with verified user', async () => {
        // Arrange
        const verifiedUser = { ...mockUser, isVerified: true };
        mockUserRepo.findOne.mockResolvedValue(verifiedUser);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        const result = await service.login('test@example.com', 'password123');

        // Assert
        expect(result.access_token).toBe('jwt-token');
        expect(result.user.isVerified).toBe(true);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when user does not exist', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.login('nonexistent@example.com', 'password')).rejects.toThrow(
          'User not found',
        );
      });

      it('should throw BadRequestException when password is invalid', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
          'Invalid password',
        );
      });

      it('should throw BadRequestException when user is not verified', async () => {
        // Arrange
        const unverifiedUser = { ...mockUser, isVerified: false };
        mockUserRepo.findOne.mockResolvedValue(unverifiedUser);
        bcrypt.compare.mockResolvedValue(true);

        // Act & Assert
        await expect(service.login('test@example.com', 'password')).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.login('test@example.com', 'password')).rejects.toThrow(
          'User not verified',
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle empty email', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login('', 'password')).rejects.toThrow(NotFoundException);
      });

      it('should handle empty password', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', '')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle null email', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(null as any, 'password')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle null password', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', null as any)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle undefined email', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(undefined as any, 'password')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle undefined password', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', undefined as any)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle very long email', async () => {
        // Arrange
        const longEmail = 'a'.repeat(300) + '@example.com';
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login(longEmail, 'password')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle very long password', async () => {
        // Arrange
        const longPassword = 'a'.repeat(1000);
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', longPassword)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle special characters in email', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.login('test+special@example.com', 'password')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle special characters in password', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);

        // Act & Assert
        await expect(service.login('test@example.com', 'p@$$w0rd!#$%')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle user without role', async () => {
        // Arrange
        const userWithoutRole = { ...mockUser, role: null };
        mockUserRepo.findOne.mockResolvedValue(userWithoutRole);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        const result = await service.login('test@example.com', 'password');

        // Assert
        expect(result.access_token).toBe('jwt-token');
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: 'test@example.com',
          sub: 'user-1',
          role: null,
        });
      });
    });

    describe('Repository interactions', () => {
      it('should call userRepo.findOne with correct parameters', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        await service.login('test@example.com', 'password');

        // Assert
        expect(userRepo.findOne).toHaveBeenCalledTimes(1);
        expect(userRepo.findOne).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
          relations: ['role'],
        });
      });

      it('should call bcrypt.compare with correct parameters', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        await service.login('test@example.com', 'password');

        // Assert
        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      });

      it('should call jwtService.sign with correct payload', async () => {
        // Arrange
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        mockJwtService.sign.mockReturnValue('jwt-token');

        // Act
        await service.login('test@example.com', 'password');

        // Assert
        expect(jwtService.sign).toHaveBeenCalledTimes(1);
        expect(jwtService.sign).toHaveBeenCalledWith({
          email: 'test@example.com',
          sub: 'user-1',
          role: mockRole,
        });
      });
    });
  });
});
