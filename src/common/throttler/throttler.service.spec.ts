import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThrottlerConfigService, RateLimitConfig } from './throttler.service';
import { User } from '../../module/users/entity/user.entity';
import { Role } from '../../module/role/entity/role.entity';

describe('ThrottlerConfigService', () => {
  let service: ThrottlerConfigService;
  let userRepo: Repository<User>;

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

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThrottlerConfigService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    service = module.get<ThrottlerConfigService>(ThrottlerConfigService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRateLimitForUser', () => {
    it('should return guest rate limit when userId is not provided', async () => {
      // Act
      const result = await service.getRateLimitForUser();

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return guest rate limit when userId is empty string', async () => {
      // Act
      const result = await service.getRateLimitForUser('');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return guest rate limit when user is not found', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getRateLimitForUser('nonexistent-user');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'nonexistent-user' },
        relations: ['role'],
      });
    });

    it('should return ADMIN rate limit for admin users', async () => {
      // Arrange
      const adminRole = { ...mockRole, name: 'ADMIN' };
      const adminUser = { ...mockUser, role: adminRole };
      mockUserRepo.findOne.mockResolvedValue(adminUser);

      // Act
      const result = await service.getRateLimitForUser('admin-user');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
    });

    it('should return THEATER_OWNER rate limit for theater owners', async () => {
      // Arrange
      const theaterOwnerRole = { ...mockRole, name: 'THEATER_OWNER' };
      const theaterOwnerUser = { ...mockUser, role: theaterOwnerRole };
      mockUserRepo.findOne.mockResolvedValue(theaterOwnerUser);

      // Act
      const result = await service.getRateLimitForUser('theater-owner-user');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
    });

    it('should return USER rate limit for regular users', async () => {
      // Arrange
      const userRole = { ...mockRole, name: 'USER' };
      const regularUser = { ...mockUser, role: userRole };
      mockUserRepo.findOne.mockResolvedValue(regularUser);

      // Act
      const result = await service.getRateLimitForUser('regular-user');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
    });

    it('should return guest rate limit for unknown role', async () => {
      // Arrange
      const unknownRole = { ...mockRole, name: 'UNKNOWN_ROLE' };
      const userWithUnknownRole = { ...mockUser, role: unknownRole };
      mockUserRepo.findOne.mockResolvedValue(userWithUnknownRole);

      // Act
      const result = await service.getRateLimitForUser('user-with-unknown-role');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
    });

    it('should return guest rate limit when user has no role', async () => {
      // Arrange
      const userWithoutRole = { ...mockUser, role: null };
      mockUserRepo.findOne.mockResolvedValue(userWithoutRole);

      // Act
      const result = await service.getRateLimitForUser('user-without-role');

      // Assert
      expect(result).toEqual({
        ttl: 60,
        limit: 50,
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockUserRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getRateLimitForUser('user-1')).rejects.toThrow('Database error');
    });
  });

  describe('setRateLimitForRole', () => {
    it('should set rate limit for a new role', () => {
      // Arrange
      const newConfig: RateLimitConfig = {
        ttl: 120,
        limit: 200,
      };

      // Act
      service.setRateLimitForRole('MANAGER', newConfig);

      // Assert
      const allLimits = service.getAllRateLimits();
      expect(allLimits.MANAGER).toEqual(newConfig);
    });

    it('should update rate limit for existing role', async () => {
      // Arrange
      const updatedConfig: RateLimitConfig = {
        ttl: 30,
        limit: 50,
      };

      // Act
      service.setRateLimitForRole('USER', updatedConfig);

      // Assert
      const userRole = { ...mockRole, name: 'USER' };
      const regularUser = { ...mockUser, role: userRole };
      mockUserRepo.findOne.mockResolvedValue(regularUser);

      const result = await service.getRateLimitForUser('regular-user');
      expect(result).toEqual(updatedConfig);
    });
  });

  describe('getAllRateLimits', () => {
    it('should return all configured rate limits including guest', () => {
      // Act
      const result = service.getAllRateLimits();

      // Assert
      expect(result).toHaveProperty('ADMIN');
      expect(result).toHaveProperty('THEATER_OWNER');
      expect(result).toHaveProperty('USER');
      expect(result).toHaveProperty('GUEST');
      expect(result.ADMIN).toEqual({ ttl: 60, limit: 50 });
      expect(result.THEATER_OWNER).toEqual({ ttl: 60, limit: 50 });
      expect(result.USER).toEqual({ ttl: 60, limit: 50 });
      expect(result.GUEST).toEqual({ ttl: 60, limit: 50 });
    });
  });

  describe('Rate limit configurations', () => {
    it('should have correct guest rate limit', async () => {
      // Act
      const result = await service.getRateLimitForUser();

      // Assert
      expect(result.ttl).toBe(60);
      expect(result.limit).toBe(50);
    });

    it('should have correct user rate limit', async () => {
      // Arrange
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.getRateLimitForUser('user-1');

      // Assert
      expect(result.ttl).toBe(60);
      expect(result.limit).toBe(50);
    });

    it('should have correct theater owner rate limit', async () => {
      // Arrange
      const theaterOwnerRole = { ...mockRole, name: 'THEATER_OWNER' };
      const theaterOwnerUser = { ...mockUser, role: theaterOwnerRole };
      mockUserRepo.findOne.mockResolvedValue(theaterOwnerUser);

      // Act
      const result = await service.getRateLimitForUser('theater-owner');

      // Assert
      expect(result.ttl).toBe(60);
      expect(result.limit).toBe(50);
    });

    it('should have correct admin rate limit', async () => {
      // Arrange
      const adminRole = { ...mockRole, name: 'ADMIN' };
      const adminUser = { ...mockUser, role: adminRole };
      mockUserRepo.findOne.mockResolvedValue(adminUser);

      // Act
      const result = await service.getRateLimitForUser('admin');

      // Assert
      expect(result.ttl).toBe(60);
      expect(result.limit).toBe(50);
    });
  });
});
