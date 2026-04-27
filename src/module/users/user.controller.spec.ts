import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './users.service';
import { AuthService } from '../auth/auth.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let authService: AuthService;

  const mockUserService = {
    registerUser: jest.fn(),
    registerTheaterOwner: jest.fn(),
    verifyOtp: jest.fn(),
    getUserById: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockMessageConfig = {
    messages: {
      AUTH: {
        USER_REGISTER: 'user registration successful',
        THEATER_OWNER_REGISTER: 'theater owner registration successful',
        OTP_VERIFY: 'OTP verified successfully',
        LOGIN: 'login successful',
        GET_USER: 'user retrieved successfully',
        FORGOT_PASSWORD: 'OTP sent successfully',
        RESET_PASSWORD: 'password reset successfully',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterUserDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobileNumber: '1234567890',
      password: 'Password123',
      roleId: 1,
    };

    const mockUser = {
      id: 'user-123',
      ...mockRegisterUserDto,
    };

    it('should register user successfully', async () => {
      // Arrange
      mockUserService.registerUser.mockResolvedValue(mockUser);

      // Act
      const result = await controller.register(mockRegisterUserDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.USER_REGISTER,
        data: mockUser,
      });
      expect(userService.registerUser).toHaveBeenCalledWith(mockRegisterUserDto);
    });

    it('should throw BadRequestException when user already exists', async () => {
      // Arrange
      mockUserService.registerUser.mockRejectedValue(
        new BadRequestException('User already exists'),
      );

      // Act & Assert
      await expect(controller.register(mockRegisterUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const invalidDto = { ...mockRegisterUserDto, email: '' } as any;
      mockUserService.registerUser.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      // Act & Assert
      await expect(controller.register(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle short password', async () => {
      // Arrange
      const invalidDto = { ...mockRegisterUserDto, password: '123' } as any;
      mockUserService.registerUser.mockRejectedValue(
        new BadRequestException('Password too short'),
      );

      // Act & Assert
      await expect(controller.register(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registerTheaterOwner', () => {
    const mockRegisterTheaterOwnerDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobileNumber: '1234567890',
      password: 'Password123',
      theatreName: 'Grand Cinema',
      businessType: 'Multiplex',
      roleId: 2,
    };

    const mockUser = {
      id: 'user-123',
      ...mockRegisterTheaterOwnerDto,
    };

    it('should register theater owner successfully', async () => {
      // Arrange
      mockUserService.registerTheaterOwner.mockResolvedValue(mockUser);

      // Act
      const result = await controller.registerTheaterOwner(mockRegisterTheaterOwnerDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.THEATER_OWNER_REGISTER,
        data: mockUser,
      });
      expect(userService.registerTheaterOwner).toHaveBeenCalledWith(
        mockRegisterTheaterOwnerDto,
      );
    });

    it('should throw BadRequestException when theater owner already exists', async () => {
      // Arrange
      mockUserService.registerTheaterOwner.mockRejectedValue(
        new BadRequestException('User already exists'),
      );

      // Act & Assert
      await expect(controller.registerTheaterOwner(mockRegisterTheaterOwnerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle missing theater name', async () => {
      // Arrange
      const invalidDto = { ...mockRegisterTheaterOwnerDto, theatreName: '' } as any;
      mockUserService.registerTheaterOwner.mockRejectedValue(
        new BadRequestException('Theater name is required'),
      );

      // Act & Assert
      await expect(controller.registerTheaterOwner(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOTP', () => {
    const mockVerifyOtpDto = {
      email: 'john@example.com',
      otp: '123456',
    };

    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      isVerified: true,
    };

    it('should verify OTP successfully', async () => {
      // Arrange
      mockUserService.verifyOtp.mockResolvedValue(mockUser);

      // Act
      const result = await controller.verifyOTP(mockVerifyOtpDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.OTP_VERIFY,
        data: mockUser,
      });
      expect(userService.verifyOtp).toHaveBeenCalledWith(
        mockVerifyOtpDto.email,
        mockVerifyOtpDto.otp,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserService.verifyOtp.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.verifyOTP(mockVerifyOtpDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when OTP is invalid', async () => {
      // Arrange
      mockUserService.verifyOtp.mockRejectedValue(
        new BadRequestException('Invalid OTP'),
      );

      // Act & Assert
      await expect(controller.verifyOTP(mockVerifyOtpDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty OTP', async () => {
      // Arrange
      const invalidDto = { ...mockVerifyOtpDto, otp: '' };
      mockUserService.verifyOtp.mockRejectedValue(
        new BadRequestException('OTP is required'),
      );

      // Act & Assert
      await expect(controller.verifyOTP(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      email: 'john@example.com',
      password: 'Password123',
    };

    const mockAuthResponse = {
      accessToken: 'jwt-token',
      user: { id: 'user-123', email: 'john@example.com' },
    };

    it('should login successfully', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(mockLoginDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.LOGIN,
        data: mockAuthResponse,
      });
      expect(authService.login).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when credentials are invalid', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Invalid credentials'),
      );

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when user is not verified', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('User not verified'),
      );

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle wrong password', async () => {
      // Arrange
      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Wrong password'),
      );

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        BadRequestException,
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
      mockUserService.getUserById.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getUserById('user-123');

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.GET_USER,
        data: mockUser,
      });
      expect(userService.getUserById).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.getUserById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid UUID format', async () => {
      // Arrange
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.getUserById('not-a-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('forgotPassword', () => {
    const mockForgotPasswordDto = {
      email: 'john@example.com',
    };

    const mockResponse = {
      message: 'OTP sent successfully',
    };

    it('should send OTP for password reset successfully', async () => {
      // Arrange
      mockUserService.forgotPassword.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.forgotPassword(mockForgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.FORGOT_PASSWORD,
        data: mockResponse,
      });
      expect(userService.forgotPassword).toHaveBeenCalledWith(
        mockForgotPasswordDto.email,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserService.forgotPassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.forgotPassword(mockForgotPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle invalid email format', async () => {
      // Arrange
      const invalidDto = { email: 'invalid-email' };
      mockUserService.forgotPassword.mockRejectedValue(
        new BadRequestException('Invalid email'),
      );

      // Act & Assert
      await expect(controller.forgotPassword(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    const mockResetPasswordDto = {
      email: 'john@example.com',
      otp: '123456',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    };

    const mockResponse = {
      message: 'Password reset successfully',
    };

    it('should reset password successfully', async () => {
      // Arrange
      mockUserService.resetPassword.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.resetPassword(mockResetPasswordDto);

      // Assert
      expect(result).toEqual({
        message: mockMessageConfig.messages.AUTH.RESET_PASSWORD,
        data: mockResponse,
      });
      expect(userService.resetPassword).toHaveBeenCalledWith(
        mockResetPasswordDto.email,
        mockResetPasswordDto.otp,
        mockResetPasswordDto.newPassword,
        mockResetPasswordDto.confirmPassword,
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserService.resetPassword.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      // Act & Assert
      await expect(controller.resetPassword(mockResetPasswordDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      // Arrange
      const invalidDto = {
        ...mockResetPasswordDto,
        confirmPassword: 'DifferentPassword',
      };
      mockUserService.resetPassword.mockRejectedValue(
        new BadRequestException('Passwords do not match'),
      );

      // Act & Assert
      await expect(controller.resetPassword(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when OTP is invalid', async () => {
      // Arrange
      mockUserService.resetPassword.mockRejectedValue(
        new BadRequestException('Invalid OTP'),
      );

      // Act & Assert
      await expect(controller.resetPassword(mockResetPasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle short new password', async () => {
      // Arrange
      const invalidDto = {
        ...mockResetPasswordDto,
        newPassword: '123',
        confirmPassword: '123',
      };
      mockUserService.resetPassword.mockRejectedValue(
        new BadRequestException('Password too short'),
      );

      // Act & Assert
      await expect(controller.resetPassword(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty OTP', async () => {
      // Arrange
      const invalidDto = { ...mockResetPasswordDto, otp: '' };
      mockUserService.resetPassword.mockRejectedValue(
        new BadRequestException('OTP is required'),
      );

      // Act & Assert
      await expect(controller.resetPassword(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
