import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntityType } from '../../common/constant';
import { AuditLog } from './entity/audit-log.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let service: jest.Mocked<AuditService>;

  const mockAuditLog: AuditLog = {
    id: 'audit-123',
    action: AuditAction.CREATE,
    entityType: AuditEntityType.MOVIE,
    entityId: 'movie-123',
    userId: 'user-123',
    userEmail: 'test@example.com',
    userRole: 'ADMIN',
    oldValues: undefined as any,
    newValues: { title: 'New Movie' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    endpoint: '/api/movies',
    description: 'Movie created',
    createdAt: new Date(),
    user: {} as any,
  };

  beforeEach(async () => {
    const mockAuditService = {
      findAll: jest.fn(),
      findByEntity: jest.fn(),
      findByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get(AuditService);
  });

  describe('findAll', () => {
    it('should return paginated audit logs with default parameters', async () => {
      // Arrange
      const expectedResult = { logs: [mockAuditLog], total: 1 };
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(1, 50, undefined, undefined, undefined, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should return paginated audit logs with custom parameters', async () => {
      // Arrange
      const expectedResult = { logs: [mockAuditLog], total: 1 };
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(
        '2',
        '25',
        'user-123',
        AuditAction.CREATE,
        AuditEntityType.MOVIE,
        startDate,
        endDate,
      );

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(
        2,
        25,
        'user-123',
        AuditAction.CREATE,
        AuditEntityType.MOVIE,
        new Date(startDate),
        new Date(endDate),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle partial parameters correctly', async () => {
      // Arrange
      const expectedResult = { logs: [mockAuditLog], total: 1 };
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(
        '3',
        undefined,
        'user-456',
        AuditAction.UPDATE,
        undefined,
        '2023-06-01',
      );

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(
        3,
        50,
        'user-456',
        AuditAction.UPDATE,
        undefined,
        new Date('2023-06-01'),
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle invalid page and limit parameters gracefully', async () => {
      // Arrange
      const expectedResult = { logs: [mockAuditLog], total: 1 };
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll('invalid', 'also-invalid');

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(NaN, NaN, undefined, undefined, undefined, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty date strings', async () => {
      // Arrange
      const expectedResult = { logs: [mockAuditLog], total: 1 };
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(undefined, undefined, undefined, undefined, undefined, '', '');

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(1, 50, undefined, undefined, undefined, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for specific entity type and ID', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByEntity.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByEntity(AuditEntityType.MOVIE, 'movie-123');

      // Assert
      expect(service.findByEntity).toHaveBeenCalledWith(AuditEntityType.MOVIE, 'movie-123');
      expect(result).toEqual(expectedResult);
    });

    it('should return audit logs for different entity types', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByEntity.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByEntity(AuditEntityType.BOOKING, 'booking-456');

      // Assert
      expect(service.findByEntity).toHaveBeenCalledWith(AuditEntityType.BOOKING, 'booking-456');
      expect(result).toEqual(expectedResult);
    });

    it('should return empty array when no logs found for entity', async () => {
      // Arrange
      const expectedResult: AuditLog[] = [];
      service.findByEntity.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByEntity(AuditEntityType.CONCESSION, 'nonexistent-id');

      // Assert
      expect(service.findByEntity).toHaveBeenCalledWith(AuditEntityType.CONCESSION, 'nonexistent-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByUser', () => {
    it('should return audit logs for specific user with default limit', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-123');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-123', 100);
      expect(result).toEqual(expectedResult);
    });

    it('should return audit logs for specific user with custom limit', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-456', '50');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-456', 50);
      expect(result).toEqual(expectedResult);
    });

    it('should handle invalid limit parameter gracefully', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-789', 'invalid-limit');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-789', NaN);
      expect(result).toEqual(expectedResult);
    });

    it('should return empty array when no logs found for user', async () => {
      // Arrange
      const expectedResult: AuditLog[] = [];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('nonexistent-user');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('nonexistent-user', 100);
      expect(result).toEqual(expectedResult);
    });

    it('should handle limit of zero', async () => {
      // Arrange
      const expectedResult: AuditLog[] = [];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-123', '0');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-123', 0);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Controller Integration', () => {
    it('should be properly instantiated', () => {
      // Assert
      expect(controller).toBeDefined();
      expect(service).toBeDefined();
    });

    it('should have all required methods', () => {
      // Assert
      expect(typeof controller.findAll).toBe('function');
      expect(typeof controller.findByEntity).toBe('function');
      expect(typeof controller.findByUser).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in findAll', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      service.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle service errors in findByEntity', async () => {
      // Arrange
      const error = new Error('Entity not found');
      service.findByEntity.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findByEntity(AuditEntityType.MOVIE, 'movie-123')).rejects.toThrow('Entity not found');
    });

    it('should handle service errors in findByUser', async () => {
      // Arrange
      const error = new Error('User not found');
      service.findByUser.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findByUser('user-123')).rejects.toThrow('User not found');
    });
  });

  describe('Parameter Validation Edge Cases', () => {
    it('should handle null and undefined parameters in findAll', async () => {
      // Arrange
      const expectedResult = { logs: [], total: 0 };
      service.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(null as any, null as any, null as any, null as any, null as any, null as any, null as any);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(1, 50, null, null, null, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle very large limit values in findByUser', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-123', '999999');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-123', 999999);
      expect(result).toEqual(expectedResult);
    });

    it('should handle negative limit values in findByUser', async () => {
      // Arrange
      const expectedResult = [mockAuditLog];
      service.findByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findByUser('user-123', '-10');

      // Assert
      expect(service.findByUser).toHaveBeenCalledWith('user-123', -10);
      expect(result).toEqual(expectedResult);
    });
  });
});
