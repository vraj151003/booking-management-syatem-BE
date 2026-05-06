import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entity/audit-log.entity';
import { AuditAction, AuditEntityType } from '../../common/constant';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;
  let repository: jest.Mocked<Repository<AuditLog>>;

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
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get(getRepositoryToken(AuditLog));
  });

  describe('createLog', () => {
    it('should create and save an audit log', async () => {
      // Arrange
      const createAuditLogDto: CreateAuditLogDto = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.MOVIE,
        entityId: 'movie-123',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userRole: 'ADMIN',
        ipAddress: '127.0.0.1',
        description: 'Movie created',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      const result = await service.createLog(createAuditLogDto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('logAdminAction', () => {
    it('should log admin action with all parameters', async () => {
      // Arrange
      const oldValues = { title: 'Old Title' };
      const newValues = { title: 'New Title' };
      const expectedCreateAuditLogDto = {
        action: AuditAction.UPDATE,
        entityType: AuditEntityType.MOVIE,
        entityId: 'movie-123',
        oldValues,
        newValues,
        userId: 'user-123',
        userEmail: 'admin@example.com',
        userRole: 'ADMIN',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/movies/movie-123',
        description: 'Movie updated',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      const result = await service.logAdminAction(
        'user-123',
        'admin@example.com',
        'ADMIN',
        AuditAction.UPDATE,
        AuditEntityType.MOVIE,
        'movie-123',
        oldValues,
        newValues,
        'Movie updated',
        '192.168.1.1',
        'Mozilla/5.0',
        '/api/movies/movie-123',
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(expectedCreateAuditLogDto);
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should use default IP address when not provided', async () => {
      // Arrange
      const expectedCreateAuditLogDto = {
        action: AuditAction.CREATE,
        entityType: AuditEntityType.CONCESSION,
        userId: 'user-123',
        userEmail: 'admin@example.com',
        userRole: 'ADMIN',
        ipAddress: 'unknown',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      await service.logAdminAction(
        'user-123',
        'admin@example.com',
        'ADMIN',
        AuditAction.CREATE,
        AuditEntityType.CONCESSION,
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: 'unknown' }),
      );
    });

    it('should handle optional parameters as undefined', async () => {
      // Arrange
      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      await service.logAdminAction(
        'user-123',
        'admin@example.com',
        'ADMIN',
        AuditAction.DELETE,
        AuditEntityType.SHOW,
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityId: undefined,
          oldValues: undefined,
          newValues: undefined,
          description: undefined,
          userAgent: undefined,
          endpoint: undefined,
        }),
      );
    });
  });

  describe('logBookingAction', () => {
    it('should log booking creation', async () => {
      // Arrange
      const expectedCreateAuditLogDto = {
        action: AuditAction.BOOKING_CREATED,
        entityType: AuditEntityType.BOOKING,
        entityId: 'booking-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'USER',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        description: 'Booking booking-123 created',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      const result = await service.logBookingAction(
        'user-123',
        'user@example.com',
        'booking-123',
        AuditAction.BOOKING_CREATED,
        undefined,
        undefined,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(expectedCreateAuditLogDto);
      expect(repository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });

    it('should log booking update with old and new values', async () => {
      // Arrange
      const oldValues = { status: 'PENDING' };
      const newValues = { status: 'CONFIRMED' };
      const expectedCreateAuditLogDto = {
        action: AuditAction.BOOKING_UPDATED,
        entityType: AuditEntityType.BOOKING,
        entityId: 'booking-456',
        userId: 'user-456',
        userEmail: 'user2@example.com',
        userRole: 'USER',
        ipAddress: '192.168.1.2',
        userAgent: 'Chrome/91.0',
        oldValues,
        newValues,
        description: 'Booking booking-456 updated',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      await service.logBookingAction(
        'user-456',
        'user2@example.com',
        'booking-456',
        AuditAction.BOOKING_UPDATED,
        oldValues,
        newValues,
        '192.168.1.2',
        'Chrome/91.0',
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(expectedCreateAuditLogDto);
    });

    it('should log booking cancellation', async () => {
      // Arrange
      const expectedCreateAuditLogDto = {
        action: AuditAction.BOOKING_CANCELLED,
        entityType: AuditEntityType.BOOKING,
        entityId: 'booking-789',
        userId: 'user-789',
        userEmail: 'user3@example.com',
        userRole: 'USER',
        ipAddress: 'unknown',
        description: 'Booking booking-789 cancelled',
      };

      repository.create.mockReturnValue(mockAuditLog);
      repository.save.mockResolvedValue(mockAuditLog);

      // Act
      await service.logBookingAction(
        'user-789',
        'user3@example.com',
        'booking-789',
        AuditAction.BOOKING_CANCELLED,
      );

      // Assert
      expect(repository.create).toHaveBeenCalledWith(expectedCreateAuditLogDto);
    });
  });

  describe('findAll', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      repository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
    });

    it('should return paginated audit logs with default parameters', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      const mockTotal = 1;
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, mockTotal]);

      // Act
      const result = await service.findAll();

      // Assert
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('auditLog');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('auditLog.user', 'user');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('auditLog.createdAt', 'DESC');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(50);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ logs: mockLogs, total: mockTotal });
    });

    it('should apply all filters correctly', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      const mockTotal = 1;
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, mockTotal]);

      // Act
      const result = await service.findAll(
        2,
        25,
        'user-123',
        AuditAction.CREATE,
        AuditEntityType.MOVIE,
        startDate,
        endDate,
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.userId = :userId', { userId: 'user-123' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.action = :action', { action: AuditAction.CREATE });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.entityType = :entityType', { entityType: AuditEntityType.MOVIE });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.createdAt >= :startDate', { startDate });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.createdAt <= :endDate', { endDate });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(25);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
      expect(result).toEqual({ logs: mockLogs, total: mockTotal });
    });

    it('should apply individual filters correctly', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      const mockTotal = 1;
      
      // Reset mock to avoid accumulation from previous tests
      jest.clearAllMocks();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, mockTotal]);

      // Act
      await service.findAll(1, 10, 'user-456');

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('auditLog.userId = :userId', { userId: 'user-456' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByEntity', () => {
    it('should find audit logs by entity type and ID', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      repository.find.mockResolvedValue(mockLogs);

      // Act
      const result = await service.findByEntity(AuditEntityType.MOVIE, 'movie-123');

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { entityType: AuditEntityType.MOVIE, entityId: 'movie-123' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByUser', () => {
    it('should find audit logs by user ID with default limit', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      repository.find.mockResolvedValue(mockLogs);

      // Act
      const result = await service.findByUser('user-123');

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should find audit logs by user ID with custom limit', async () => {
      // Arrange
      const mockLogs = [mockAuditLog];
      repository.find.mockResolvedValue(mockLogs);

      // Act
      const result = await service.findByUser('user-456', 50);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-456' },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
