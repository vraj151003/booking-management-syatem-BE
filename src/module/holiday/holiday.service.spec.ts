import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { Holiday } from './entity/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday-dto';

describe('HolidayService', () => {
  let service: HolidayService;
  let holidayRepo: jest.Mocked<Repository<Holiday>>;

  const mockHoliday: Holiday = {
    id: 'holiday-1',
    date: '2024-12-25',
    name: 'Christmas Day',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCreateHolidayDto: CreateHolidayDto = {
    date: '2024-12-25',
    name: 'Christmas Day',
    isActive: true,
  };

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HolidayService,
        {
          provide: getRepositoryToken(Holiday),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HolidayService>(HolidayService);
    holidayRepo = module.get(getRepositoryToken(Holiday));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHoliday', () => {
    it('should create a new holiday successfully', async () => {
      // Arrange
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.createHoliday(mockCreateHolidayDto);

      // Assert
      expect(result).toEqual(mockHoliday);
      expect(holidayRepo.create).toHaveBeenCalledWith(mockCreateHolidayDto);
      expect(holidayRepo.save).toHaveBeenCalledWith(mockHoliday);
    });

    it('should create holiday with default isActive true when not provided', async () => {
      // Arrange
      const dtoWithoutIsActive = { date: '2024-12-25', name: 'Christmas Day' };
      const holidayWithDefault = { ...mockHoliday, isActive: true };
      holidayRepo.create.mockReturnValue(holidayWithDefault);
      holidayRepo.save.mockResolvedValue(holidayWithDefault);

      // Act
      const result = await service.createHoliday(dtoWithoutIsActive as CreateHolidayDto);

      // Assert
      expect(holidayRepo.create).toHaveBeenCalledWith(dtoWithoutIsActive);
      expect(result.isActive).toBe(true);
    });

    it('should create holiday with custom isActive false', async () => {
      // Arrange
      const dtoWithInactive = { ...mockCreateHolidayDto, isActive: false };
      const inactiveHoliday = { ...mockHoliday, isActive: false };
      holidayRepo.create.mockReturnValue(inactiveHoliday);
      holidayRepo.save.mockResolvedValue(inactiveHoliday);

      // Act
      const result = await service.createHoliday(dtoWithInactive);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it('should handle repository save error', async () => {
      // Arrange
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createHoliday(mockCreateHolidayDto)).rejects.toThrow('Database error');
    });

    it('should handle null date in DTO', async () => {
      // Arrange
      const dtoWithNullDate = { ...mockCreateHolidayDto, date: null as any };
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.createHoliday(dtoWithNullDate);

      // Assert
      expect(holidayRepo.create).toHaveBeenCalledWith(dtoWithNullDate);
    });

    it('should handle empty name in DTO', async () => {
      // Arrange
      const dtoWithEmptyName = { ...mockCreateHolidayDto, name: '' };
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.createHoliday(dtoWithEmptyName);

      // Assert
      expect(holidayRepo.create).toHaveBeenCalledWith(dtoWithEmptyName);
    });

    it('should handle very long name', async () => {
      // Arrange
      const longName = 'A'.repeat(1000);
      const dtoWithLongName = { ...mockCreateHolidayDto, name: longName };
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.createHoliday(dtoWithLongName);

      // Assert
      expect(holidayRepo.create).toHaveBeenCalledWith(dtoWithLongName);
    });
  });

  describe('findAllHolidays', () => {
    it('should return all holidays', async () => {
      // Arrange
      const holidays = [
        { ...mockHoliday, date: '2024-12-25', name: 'Christmas' },
        { ...mockHoliday, date: '2024-01-01', name: 'New Year' },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(holidays);

      // Act
      const result = await service.findAllHolidays();

      // Assert
      expect(result).toEqual(holidays);
      expect(holidayRepo.createQueryBuilder).toHaveBeenCalledWith('holiday');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'holiday.isActive = :isActive',
        { isActive: true }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should return empty array when no holidays exist', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await service.findAllHolidays();

      // Assert
      expect(result).toEqual([]);
      expect(holidayRepo.createQueryBuilder).toHaveBeenCalledWith('holiday');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should handle repository find error', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAllHolidays()).rejects.toThrow('Database error');
    });

    it('should not return inactive holidays', async () => {
      // Arrange
      const activeHoliday = { ...mockHoliday, isActive: true };
      mockQueryBuilder.getMany.mockResolvedValue([activeHoliday]);

      // Act
      const result = await service.findAllHolidays();

      // Assert
      expect(holidayRepo.createQueryBuilder).toHaveBeenCalledWith('holiday');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'holiday.isActive = :isActive',
        { isActive: true }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });

  describe('findOneHoliday', () => {
    it('should return holiday by id', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.findOneHoliday('holiday-1');

      // Assert
      expect(result).toEqual(mockHoliday);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({ where: { id: 'holiday-1' } });
    });

    it('should throw NotFoundException when holiday not found', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneHoliday('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOneHoliday('non-existent-id')).rejects.toThrow('Holiday not found');
    });

    it('should handle repository findOne error', async () => {
      // Arrange
      holidayRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findOneHoliday('holiday-1')).rejects.toThrow('Database error');
    });

    it('should handle empty string id', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneHoliday('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneHoliday(null as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid uuid format', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneHoliday('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateHoliday', () => {
    it('should update holiday successfully', async () => {
      // Arrange
      const updatedHoliday = { ...mockHoliday, name: 'Updated Christmas' };
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(updatedHoliday);

      // Act
      const result = await service.updateHoliday('holiday-1', mockCreateHolidayDto);

      // Assert
      expect(result).toEqual(updatedHoliday);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({ where: { id: 'holiday-1' } });
      expect(holidayRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateHoliday('non-existent-id', mockCreateHolidayDto)).rejects.toThrow(NotFoundException);
    });

    it('should update holiday date', async () => {
      // Arrange
      const updatedDto = { ...mockCreateHolidayDto, date: '2024-12-26' };
      const updatedHoliday = { ...mockHoliday, date: '2024-12-26' };
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(updatedHoliday);

      // Act
      const result = await service.updateHoliday('holiday-1', updatedDto);

      // Assert
      expect(result.date).toBe('2024-12-26');
    });

    it('should update holiday name', async () => {
      // Arrange
      const updatedDto = { ...mockCreateHolidayDto, name: 'New Name' };
      const updatedHoliday = { ...mockHoliday, name: 'New Name' };
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(updatedHoliday);

      // Act
      const result = await service.updateHoliday('holiday-1', updatedDto);

      // Assert
      expect(result.name).toBe('New Name');
    });

    it('should update holiday isActive status', async () => {
      // Arrange
      const updatedDto = { ...mockCreateHolidayDto, isActive: false };
      const updatedHoliday = { ...mockHoliday, isActive: false };
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(updatedHoliday);

      // Act
      const result = await service.updateHoliday('holiday-1', updatedDto);

      // Assert
      expect(result.isActive).toBe(false);
    });

    it('should handle repository save error during update', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.updateHoliday('holiday-1', mockCreateHolidayDto)).rejects.toThrow('Database error');
    });

    it('should handle partial update with only date', async () => {
      // Arrange
      const partialDto = { date: '2024-12-26', name: '', isActive: true };
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.updateHoliday('holiday-1', partialDto);

      // Assert
      expect(holidayRepo.save).toHaveBeenCalled();
    });
  });

  describe('deleteHoliday', () => {
    it('should delete holiday successfully', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.remove.mockResolvedValue(mockHoliday);

      // Act
      await service.deleteHoliday('holiday-1');

      // Assert
      expect(holidayRepo.findOne).toHaveBeenCalledWith({ where: { id: 'holiday-1' } });
      expect(holidayRepo.remove).toHaveBeenCalledWith(mockHoliday);
    });

    it('should throw NotFoundException when deleting non-existent holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteHoliday('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle repository remove error', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);
      holidayRepo.remove.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.deleteHoliday('holiday-1')).rejects.toThrow('Database error');
    });

    it('should handle empty string id', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteHoliday('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteHoliday(null as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isHoliday', () => {
    it('should return true when date is a holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.isHoliday('2024-12-25');

      // Assert
      expect(result).toBe(true);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({
        where: { date: '2024-12-25', isActive: true },
      });
    });

    it('should return false when date is not a holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday('2024-12-25');

      // Assert
      expect(result).toBe(false);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({
        where: { date: '2024-12-25', isActive: true },
      });
    });

    it('should return false for inactive holiday', async () => {
      // Arrange
      const inactiveHoliday = { ...mockHoliday, isActive: false };
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday('2024-12-25');

      // Assert
      expect(result).toBe(false);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({
        where: { date: '2024-12-25', isActive: true },
      });
    });

    it('should handle repository findOne error', async () => {
      // Arrange
      holidayRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.isHoliday('2024-12-25')).rejects.toThrow('Database error');
    });

    it('should handle empty date string', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday('');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle invalid date format', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday('invalid-date');

      // Assert
      expect(result).toBe(false);
    });

    it('should handle null date', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday(null as any);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle undefined date', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday(undefined as any);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle leap year date', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.isHoliday('2024-02-29');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getHolidayByDate', () => {
    it('should return holiday when date matches', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      const result = await service.getHolidayByDate('2024-12-25');

      // Assert
      expect(result).toEqual(mockHoliday);
      expect(holidayRepo.findOne).toHaveBeenCalledWith({
        where: { date: '2024-12-25', isActive: true },
      });
    });

    it('should return null when date does not match any holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate('2024-12-25');

      // Assert
      expect(result).toBeNull();
      expect(holidayRepo.findOne).toHaveBeenCalledWith({
        where: { date: '2024-12-25', isActive: true },
      });
    });

    it('should return null for inactive holiday', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate('2024-12-25');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository findOne error', async () => {
      // Arrange
      holidayRepo.findOne.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getHolidayByDate('2024-12-25')).rejects.toThrow('Database error');
    });

    it('should handle empty date string', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle invalid date format', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate('invalid-date');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle null date', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate(null as any);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle undefined date', async () => {
      // Arrange
      holidayRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getHolidayByDate(undefined as any);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Integration scenarios', () => {
    it('should create and then find holiday', async () => {
      // Arrange
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      await service.createHoliday(mockCreateHolidayDto);
      const found = await service.findOneHoliday('holiday-1');

      // Assert
      expect(found).toEqual(mockHoliday);
    });

    it('should create, update, and then find holiday', async () => {
      // Arrange
      const updatedHoliday = { ...mockHoliday, name: 'Updated' };
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday).mockResolvedValue(updatedHoliday);
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      await service.createHoliday(mockCreateHolidayDto);
      await service.updateHoliday('holiday-1', { ...mockCreateHolidayDto, name: 'Updated' });
      const found = await service.findOneHoliday('holiday-1');

      // Assert
      expect(holidayRepo.save).toHaveBeenCalledTimes(2);
    });

    it('should check holiday status after creation', async () => {
      // Arrange
      holidayRepo.create.mockReturnValue(mockHoliday);
      holidayRepo.save.mockResolvedValue(mockHoliday);
      holidayRepo.findOne.mockResolvedValue(mockHoliday);

      // Act
      await service.createHoliday(mockCreateHolidayDto);
      const isHoliday = await service.isHoliday('2024-12-25');

      // Assert
      expect(isHoliday).toBe(true);
    });

    it('should return false for holiday after deletion', async () => {
      // Arrange
      holidayRepo.findOne
        .mockResolvedValueOnce(mockHoliday) // For deleteHoliday
        .mockResolvedValueOnce(null); // For isHoliday
      holidayRepo.remove.mockResolvedValue(mockHoliday);

      // Act
      await service.deleteHoliday('holiday-1');
      const isHoliday = await service.isHoliday('2024-12-25');

      // Assert
      expect(isHoliday).toBe(false);
    });
  });
});
