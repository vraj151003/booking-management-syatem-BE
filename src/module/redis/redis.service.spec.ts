import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: any;

  beforeEach(async () => {
    mockRedisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    (service as any).client = mockRedisClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setLock', () => {
    it('should set lock with key, value, and TTL', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = 300;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      const result = await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', ttl);
      expect(result).toBe('OK');
    });

    it('should handle Redis errors during set', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = 300;
      mockRedisClient.set.mockRejectedValue(new Error('Redis connection error'));

      // Act & Assert
      await expect(service.setLock(key, value, ttl)).rejects.toThrow('Redis connection error');
    });

    it('should handle empty key', async () => {
      // Arrange
      const key = '';
      const value = 'user-123';
      const ttl = 300;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith('', value, 'EX', ttl);
    });

    it('should handle empty value', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = '';
      const ttl = 300;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, '', 'EX', ttl);
    });

    it('should handle zero TTL', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = 0;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', 0);
    });

    it('should handle negative TTL', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = -1;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', -1);
    });

    it('should handle very large TTL', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = 999999;
      mockRedisClient.set.mockResolvedValue('OK');

      // Act
      await service.setLock(key, value, ttl);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', 999999);
    });
  });

  describe('getLock', () => {
    it('should get lock value by key', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const expectedValue = 'user-123';
      mockRedisClient.get.mockResolvedValue(expectedValue);

      // Act
      const result = await service.getLock(key);

      // Assert
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(expectedValue);
    });

    it('should return null when lock does not exist', async () => {
      // Arrange
      const key = 'lock:seat-1';
      mockRedisClient.get.mockResolvedValue(null);

      // Act
      const result = await service.getLock(key);

      // Assert
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle Redis errors during get', async () => {
      // Arrange
      const key = 'lock:seat-1';
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));

      // Act & Assert
      await expect(service.getLock(key)).rejects.toThrow('Redis connection error');
    });

    it('should handle empty key', async () => {
      // Arrange
      const key = '';
      mockRedisClient.get.mockResolvedValue(null);

      // Act
      await service.getLock(key);

      // Assert
      expect(mockRedisClient.get).toHaveBeenCalledWith('');
    });

    it('should handle special characters in key', async () => {
      // Arrange
      const key = 'lock:seat-1:with:special:chars';
      const expectedValue = 'user-123';
      mockRedisClient.get.mockResolvedValue(expectedValue);

      // Act
      const result = await service.getLock(key);

      // Assert
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(expectedValue);
    });
  });

  describe('deleteLock', () => {
    it('should delete lock by key', async () => {
      // Arrange
      const key = 'lock:seat-1';
      mockRedisClient.del.mockResolvedValue(1);

      // Act
      const result = await service.deleteLock(key);

      // Assert
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    it('should return 0 when lock does not exist', async () => {
      // Arrange
      const key = 'lock:seat-1';
      mockRedisClient.del.mockResolvedValue(0);

      // Act
      const result = await service.deleteLock(key);

      // Assert
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(result).toBe(0);
    });

    it('should handle Redis errors during delete', async () => {
      // Arrange
      const key = 'lock:seat-1';
      mockRedisClient.del.mockRejectedValue(new Error('Redis connection error'));

      // Act & Assert
      await expect(service.deleteLock(key)).rejects.toThrow('Redis connection error');
    });

    it('should handle empty key', async () => {
      // Arrange
      const key = '';
      mockRedisClient.del.mockResolvedValue(0);

      // Act
      await service.deleteLock(key);

      // Assert
      expect(mockRedisClient.del).toHaveBeenCalledWith('');
    });

    it('should handle deletion of multiple locks (if called multiple times)', async () => {
      // Arrange
      const key1 = 'lock:seat-1';
      const key2 = 'lock:seat-2';
      mockRedisClient.del.mockResolvedValue(1);

      // Act
      await service.deleteLock(key1);
      await service.deleteLock(key2);

      // Assert
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenNthCalledWith(1, key1);
      expect(mockRedisClient.del).toHaveBeenNthCalledWith(2, key2);
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full lock lifecycle: set, get, delete', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value = 'user-123';
      const ttl = 300;
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(value);
      mockRedisClient.del.mockResolvedValue(1);

      // Act
      await service.setLock(key, value, ttl);
      const retrievedValue = await service.getLock(key);
      await service.deleteLock(key);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, value, 'EX', ttl);
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
      expect(retrievedValue).toBe(value);
    });

    it('should handle concurrent lock operations', async () => {
      // Arrange
      const key = 'lock:seat-1';
      const value1 = 'user-123';
      const value2 = 'user-456';
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(value2);
      mockRedisClient.del.mockResolvedValue(1);

      // Act
      await service.setLock(key, value1, 300);
      await service.setLock(key, value2, 300);
      const retrievedValue = await service.getLock(key);
      await service.deleteLock(key);

      // Assert
      expect(mockRedisClient.set).toHaveBeenCalledTimes(2);
      expect(retrievedValue).toBe(value2);
    });
  });
});
