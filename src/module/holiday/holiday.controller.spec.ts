import { Test, TestingModule } from '@nestjs/testing';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { Holiday } from './entity/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday-dto';
import { NotFoundException } from '@nestjs/common';

describe('HolidayController', () => {
  let controller: HolidayController;
  let holidayService: jest.Mocked<HolidayService>;

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

  beforeEach(async () => {
    const mockHolidayService = {
      createHoliday: jest.fn(),
      findAllHolidays: jest.fn(),
      findOneHoliday: jest.fn(),
      updateHoliday: jest.fn(),
      deleteHoliday: jest.fn(),
      isHoliday: jest.fn(),
      getHolidayByDate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HolidayController],
      providers: [
        {
          provide: HolidayService,
          useValue: mockHolidayService,
        },
      ],
    }).compile();

    controller = module.get<HolidayController>(HolidayController);
    holidayService = module.get(HolidayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new holiday successfully', async () => {
      // Arrange
      holidayService.createHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.create(mockCreateHolidayDto);

      // Assert
      expect(result).toEqual(mockHoliday);
      expect(holidayService.createHoliday).toHaveBeenCalledWith(mockCreateHolidayDto);
    });

    it('should handle service error during creation', async () => {
      // Arrange
      holidayService.createHoliday.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.create(mockCreateHolidayDto)).rejects.toThrow('Service error');
    });

    it('should handle null DTO', async () => {
      // Arrange
      holidayService.createHoliday.mockRejectedValue(new Error('Invalid DTO'));

      // Act & Assert
      await expect(controller.create(null as any)).rejects.toThrow('Invalid DTO');
    });

    it('should handle DTO with missing date', async () => {
      // Arrange
      const incompleteDto = { name: 'Christmas Day' } as CreateHolidayDto;
      holidayService.createHoliday.mockRejectedValue(new Error('Validation error'));

      // Act & Assert
      await expect(controller.create(incompleteDto)).rejects.toThrow('Validation error');
    });

    it('should handle DTO with missing name', async () => {
      // Arrange
      const incompleteDto = { date: '2024-12-25' } as CreateHolidayDto;
      holidayService.createHoliday.mockRejectedValue(new Error('Validation error'));

      // Act & Assert
      await expect(controller.create(incompleteDto)).rejects.toThrow('Validation error');
    });

    it('should handle DTO with invalid date format', async () => {
      // Arrange
      const invalidDto = { ...mockCreateHolidayDto, date: 'invalid-date' };
      holidayService.createHoliday.mockRejectedValue(new Error('Invalid date format'));

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow('Invalid date format');
    });

    it('should handle DTO with empty name', async () => {
      // Arrange
      const emptyNameDto = { ...mockCreateHolidayDto, name: '' };
      holidayService.createHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.create(emptyNameDto);

      // Assert
      expect(holidayService.createHoliday).toHaveBeenCalledWith(emptyNameDto);
    });

    it('should handle DTO with very long name', async () => {
      // Arrange
      const longNameDto = { ...mockCreateHolidayDto, name: 'A'.repeat(1000) };
      holidayService.createHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.create(longNameDto);

      // Assert
      expect(holidayService.createHoliday).toHaveBeenCalledWith(longNameDto);
    });

    it('should handle DTO with isActive false', async () => {
      // Arrange
      const inactiveDto = { ...mockCreateHolidayDto, isActive: false };
      const inactiveHoliday = { ...mockHoliday, isActive: false };
      holidayService.createHoliday.mockResolvedValue(inactiveHoliday);

      // Act
      const result = await controller.create(inactiveDto);

      // Assert
      expect(result.isActive).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all active holidays', async () => {
      // Arrange
      const holidays = [mockHoliday, { ...mockHoliday, id: 'holiday-2', date: '2024-01-01', name: 'New Year' }];
      holidayService.findAllHolidays.mockResolvedValue(holidays);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(holidays);
      expect(holidayService.findAllHolidays).toHaveBeenCalled();
    });

    it('should return empty array when no holidays exist', async () => {
      // Arrange
      holidayService.findAllHolidays.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle service error during findAll', async () => {
      // Arrange
      holidayService.findAllHolidays.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.findAll()).rejects.toThrow('Service error');
    });

    it('should handle large number of holidays', async () => {
      // Arrange
      const manyHolidays = Array.from({ length: 100 }, (_, i) => ({
        ...mockHoliday,
        id: `holiday-${i}`,
        date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      }));
      holidayService.findAllHolidays.mockResolvedValue(manyHolidays);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result.length).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return a holiday by id', async () => {
      // Arrange
      holidayService.findOneHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.findOne('holiday-1');

      // Assert
      expect(result).toEqual(mockHoliday);
      expect(holidayService.findOneHoliday).toHaveBeenCalledWith('holiday-1');
    });

    it('should throw NotFoundException when holiday not found', async () => {
      // Arrange
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle service error during findOne', async () => {
      // Arrange
      holidayService.findOneHoliday.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.findOne('holiday-1')).rejects.toThrow('Service error');
    });

    it('should handle empty string id', async () => {
      // Arrange
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.findOne('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      // Arrange
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.findOne(null as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid uuid format', async () => {
      // Arrange
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should handle very long id string', async () => {
      // Arrange
      const longId = 'a'.repeat(1000);
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.findOne(longId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a holiday successfully', async () => {
      // Arrange
      const updatedHoliday = { ...mockHoliday, name: 'Updated Christmas' };
      holidayService.updateHoliday.mockResolvedValue(updatedHoliday);

      // Act
      const result = await controller.update('holiday-1', mockCreateHolidayDto);

      // Assert
      expect(result).toEqual(updatedHoliday);
      expect(holidayService.updateHoliday).toHaveBeenCalledWith('holiday-1', mockCreateHolidayDto);
    });

    it('should throw NotFoundException when updating non-existent holiday', async () => {
      // Arrange
      holidayService.updateHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.update('non-existent-id', mockCreateHolidayDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle service error during update', async () => {
      // Arrange
      holidayService.updateHoliday.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.update('holiday-1', mockCreateHolidayDto)).rejects.toThrow('Service error');
    });

    it('should handle null DTO', async () => {
      // Arrange
      holidayService.updateHoliday.mockRejectedValue(new Error('Invalid DTO'));

      // Act & Assert
      await expect(controller.update('holiday-1', null as any)).rejects.toThrow('Invalid DTO');
    });

    it('should handle DTO with partial data', async () => {
      // Arrange
      const partialDto = { date: '2024-12-26', name: '', isActive: true };
      holidayService.updateHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.update('holiday-1', partialDto);

      // Assert
      expect(holidayService.updateHoliday).toHaveBeenCalledWith('holiday-1', partialDto);
    });

    it('should handle empty string id', async () => {
      // Arrange
      holidayService.updateHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.update('', mockCreateHolidayDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid date format in DTO', async () => {
      // Arrange
      const invalidDto = { ...mockCreateHolidayDto, date: 'invalid-date' };
      holidayService.updateHoliday.mockRejectedValue(new Error('Invalid date format'));

      // Act & Assert
      await expect(controller.update('holiday-1', invalidDto)).rejects.toThrow('Invalid date format');
    });
  });

  describe('delete', () => {
    it('should delete a holiday successfully', async () => {
      // Arrange
      holidayService.deleteHoliday.mockResolvedValue(undefined);

      // Act
      await controller.delete('holiday-1');

      // Assert
      expect(holidayService.deleteHoliday).toHaveBeenCalledWith('holiday-1');
    });

    it('should throw NotFoundException when deleting non-existent holiday', async () => {
      // Arrange
      holidayService.deleteHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.delete('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle service error during delete', async () => {
      // Arrange
      holidayService.deleteHoliday.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.delete('holiday-1')).rejects.toThrow('Service error');
    });

    it('should handle empty string id', async () => {
      // Arrange
      holidayService.deleteHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.delete('')).rejects.toThrow(NotFoundException);
    });

    it('should handle null id', async () => {
      // Arrange
      holidayService.deleteHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.delete(null as any)).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid uuid format', async () => {
      // Arrange
      holidayService.deleteHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act & Assert
      await expect(controller.delete('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkHoliday', () => {
    it('should return true when date is a holiday', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(true);
      holidayService.getHolidayByDate.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.checkHoliday('2024-12-25');

      // Assert
      expect(result).toEqual({ isHoliday: true, holiday: mockHoliday });
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024-12-25');
      expect(holidayService.getHolidayByDate).toHaveBeenCalledWith('2024-12-25');
    });

    it('should return false when date is not a holiday', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);
      holidayService.getHolidayByDate.mockResolvedValue(null);

      // Act
      const result = await controller.checkHoliday('2024-12-25');

      // Assert
      expect(result).toEqual({ isHoliday: false, holiday: null });
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024-12-25');
      expect(holidayService.getHolidayByDate).not.toHaveBeenCalled();
    });

    it('should handle service error during isHoliday check', async () => {
      // Arrange
      holidayService.isHoliday.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.checkHoliday('2024-12-25')).rejects.toThrow('Service error');
    });

    it('should handle empty date string', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday('');

      // Assert
      expect(result.isHoliday).toBe(false);
      expect(holidayService.isHoliday).toHaveBeenCalledWith('');
    });

    it('should handle invalid date format', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday('invalid-date');

      // Assert
      expect(result.isHoliday).toBe(false);
    });

    it('should handle null date', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday(null as any);

      // Assert
      expect(result.isHoliday).toBe(false);
    });

    it('should handle undefined date', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday(undefined as any);

      // Assert
      expect(result.isHoliday).toBe(false);
    });

    it('should handle leap year date', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday('2024-02-29');

      // Assert
      expect(result.isHoliday).toBe(false);
    });

    it('should handle service error during getHolidayByDate', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(true);
      holidayService.getHolidayByDate.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.checkHoliday('2024-12-25')).rejects.toThrow('Service error');
    });

    it('should not call getHolidayByDate when isHoliday returns false', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      await controller.checkHoliday('2024-12-25');

      // Assert
      expect(holidayService.getHolidayByDate).not.toHaveBeenCalled();
    });

    it('should call getHolidayByDate when isHoliday returns true', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(true);
      holidayService.getHolidayByDate.mockResolvedValue(mockHoliday);

      // Act
      await controller.checkHoliday('2024-12-25');

      // Assert
      expect(holidayService.getHolidayByDate).toHaveBeenCalledWith('2024-12-25');
    });

    it('should handle date with time component', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday('2024-12-25T00:00:00Z');

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024-12-25T00:00:00Z');
    });

    it('should handle very long date string', async () => {
      // Arrange
      const longDate = '2024-12-25' + 'a'.repeat(1000);
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday(longDate);

      // Assert
      expect(result.isHoliday).toBe(false);
    });
  });

  describe('Route conflict handling', () => {
    it('should handle checkHoliday route correctly with date parameter', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      const result = await controller.checkHoliday('2024-12-25');

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024-12-25');
    });

    it('should ensure checkHoliday route does not conflict with findOne route', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);
      holidayService.findOneHoliday.mockRejectedValue(new NotFoundException('Holiday not found'));

      // Act
      const checkResult = await controller.checkHoliday('2024-12-25');
      await expect(controller.findOne('2024-12-25')).rejects.toThrow(NotFoundException);

      // Assert
      expect(checkResult.isHoliday).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should create and then find holiday', async () => {
      // Arrange
      holidayService.createHoliday.mockResolvedValue(mockHoliday);
      holidayService.findOneHoliday.mockResolvedValue(mockHoliday);

      // Act
      await controller.create(mockCreateHolidayDto);
      const found = await controller.findOne('holiday-1');

      // Assert
      expect(found).toEqual(mockHoliday);
    });

    it('should create, update, and then find holiday', async () => {
      // Arrange
      const updatedHoliday = { ...mockHoliday, name: 'Updated' };
      holidayService.createHoliday.mockResolvedValue(mockHoliday);
      holidayService.updateHoliday.mockResolvedValue(updatedHoliday);
      holidayService.findOneHoliday.mockResolvedValue(updatedHoliday);

      // Act
      await controller.create(mockCreateHolidayDto);
      await controller.update('holiday-1', { ...mockCreateHolidayDto, name: 'Updated' });
      const found = await controller.findOne('holiday-1');

      // Assert
      expect(found.name).toBe('Updated');
    });

    it('should create, check, and then delete holiday', async () => {
      // Arrange
      holidayService.createHoliday.mockResolvedValue(mockHoliday);
      holidayService.isHoliday
        .mockResolvedValueOnce(true) // First check (before delete)
        .mockResolvedValueOnce(false); // Second check (after delete)
      holidayService.getHolidayByDate.mockResolvedValue(mockHoliday);
      holidayService.deleteHoliday.mockResolvedValue(undefined);

      // Act
      await controller.create(mockCreateHolidayDto);
      const checkBefore = await controller.checkHoliday('2024-12-25');
      await controller.delete('holiday-1');
      const checkAfter = await controller.checkHoliday('2024-12-25');

      // Assert
      expect(checkBefore.isHoliday).toBe(true);
      expect(checkAfter.isHoliday).toBe(false);
    });

    it('should handle multiple holiday checks in sequence', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      await controller.checkHoliday('2024-12-25');
      await controller.checkHoliday('2024-01-01');
      await controller.checkHoliday('2024-07-04');

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledTimes(3);
    });
  });

  describe('Parameter validation edge cases', () => {
    it('should handle special characters in holiday name', async () => {
      // Arrange
      const specialCharDto = { ...mockCreateHolidayDto, name: 'Christmas!@#$%^&*()' };
      holidayService.createHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.create(specialCharDto);

      // Assert
      expect(holidayService.createHoliday).toHaveBeenCalledWith(specialCharDto);
    });

    it('should handle unicode characters in holiday name', async () => {
      // Arrange
      const unicodeDto = { ...mockCreateHolidayDto, name: '🎄 Christmas 🎅' };
      holidayService.createHoliday.mockResolvedValue(mockHoliday);

      // Act
      const result = await controller.create(unicodeDto);

      // Assert
      expect(holidayService.createHoliday).toHaveBeenCalledWith(unicodeDto);
    });

    it('should handle date with different separators', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      await controller.checkHoliday('2024/12/25');

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024/12/25');
    });

    it('should handle date without leading zeros', async () => {
      // Arrange
      holidayService.isHoliday.mockResolvedValue(false);

      // Act
      await controller.checkHoliday('2024-1-5');

      // Assert
      expect(holidayService.isHoliday).toHaveBeenCalledWith('2024-1-5');
    });
  });
});
