import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CustomThrottlerGuard } from './throttler.guard';
import { ThrottlerConfigService } from './throttler.service';
import { RedisService } from '../../module/redis/redis.service';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  let throttlerConfigService: ThrottlerConfigService;
  let redisService: RedisService;
  let reflector: Reflector;

  const mockThrottlerConfigService = {
    getRateLimitForUser: jest.fn(),
  };

  const mockRedisService = {
    getLock: jest.fn(),
    setLock: jest.fn(),
    increment: jest.fn(),
    expire: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockRequest: any = {
    user: { id: 'user-1' },
    ip: '127.0.0.1',
  };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomThrottlerGuard,
        {
          provide: ThrottlerConfigService,
          useValue: mockThrottlerConfigService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);
    throttlerConfigService = module.get<ThrottlerConfigService>(ThrottlerConfigService);
    redisService = module.get<RedisService>(RedisService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should bypass throttling when BYPASS_THROTTLE is true', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockThrottlerConfigService.getRateLimitForUser).not.toHaveBeenCalled();
      expect(mockRedisService.getLock).not.toHaveBeenCalled();
    });

    it('should allow first request when no counter exists', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 49);
    });

    it('should allow request when under limit', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(10);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 40);
    });

    it('should throw ForbiddenException when limit is exceeded', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(51);

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow(
        ForbiddenException
      );
      await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow(
        'Too many requests. Please try again later.'
      );
    });

    it('should use IP-based tracking for unauthenticated users', async () => {
      // Arrange
      mockRequest.user = null;
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockThrottlerConfigService.getRateLimitForUser).toHaveBeenCalledWith(undefined);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1', 60);
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockRejectedValue(
        new Error('Redis connection error')
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow(
        'Redis connection error'
      );
    });

    it('should set correct rate limit headers', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(10);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 50);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 40);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(Number)
      );
    });

    it('should handle invalid count from Redis', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1' };
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
    });

    it('should handle zero count from Redis', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1' };
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
    });

    it('should check both handler and class for bypass metadata', async () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        'bypassThrottle',
        expect.any(Array)
      );
    });
  });

  describe('Rate limit tiers', () => {
    it('should apply guest rate limits for unauthenticated users', async () => {
      // Arrange
      mockRequest.user = null;
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(mockThrottlerConfigService.getRateLimitForUser).toHaveBeenCalledWith(undefined);
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:ip:127.0.0.1', 60);
    });

    it('should apply user rate limits for authenticated users', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1' };
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockThrottlerConfigService.getRateLimitForUser).toHaveBeenCalledWith('user-1');
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
    });

    it('should apply admin rate limits for admin users', async () => {
      // Arrange
      mockRequest.user = { id: 'user-1' };
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockThrottlerConfigService.getRateLimitForUser.mockResolvedValue({
        ttl: 60,
        limit: 50,
      });
      mockRedisService.increment.mockResolvedValue(1);
      mockRedisService.expire.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockExecutionContext as any);

      // Assert
      expect(result).toBe(true);
      expect(mockThrottlerConfigService.getRateLimitForUser).toHaveBeenCalledWith('user-1');
      expect(mockRedisService.increment).toHaveBeenCalledWith('rate_limit:user:user-1');
      expect(mockRedisService.expire).toHaveBeenCalledWith('rate_limit:user:user-1', 60);
    });
  });
});

