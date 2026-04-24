import { Test, TestingModule } from '@nestjs/testing';
import { ScreenController } from './screen.controller';
import { ScreenService } from './screen.service';
import { CreateScreenDTO } from './dto/create-screen-dto';
import { UpdateScreenDTO } from './dto/update-screen.dto';

describe('ScreenController', () => {
  let controller: ScreenController;
  let service: ScreenService;

  const mockScreen = {
    id: 'screen-1',
    name: 'Screen 1',
    totalSeats: 100,
    isActive: true,
    theaterOwner: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
  };

  const mockScreenService = {
    createScreen: jest.fn(),
    findAllScreen: jest.fn(),
    findOne: jest.fn(),
    updateScreen: jest.fn(),
    deleteScreen: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScreenController],
      providers: [
        {
          provide: ScreenService,
          useValue: mockScreenService,
        },
      ],
    }).compile();

    controller = module.get<ScreenController>(ScreenController);
    service = module.get<ScreenService>(ScreenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Success cases', () => {
      it('should create a screen successfully', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [
            { row: 'A', seats: 10, type: 'GOLD' },
            { row: 'B', seats: 12, type: 'SILVER' },
          ],
        };
        mockScreenService.createScreen.mockResolvedValue({
          message: 'Screen created successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.create(dto);

        // Assert
        expect(result).toEqual({
          message: 'Screen created successfully',
          data: mockScreen,
        });
        expect(service.createScreen).toHaveBeenCalledWith(dto);
      });

      it('should create screen with single row layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockScreenService.createScreen.mockResolvedValue({
          message: 'Screen created successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.create(dto);

        // Assert
        expect(result.data).toEqual(mockScreen);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockScreenService.createScreen.mockRejectedValue(new Error('Service error'));

        // Act & Assert
        await expect(controller.create(dto)).rejects.toThrow('Service error');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto = {} as CreateScreenDTO;
        mockScreenService.createScreen.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(dto)).rejects.toThrow('Validation error');
      });

      it('should handle null dto', async () => {
        // Arrange
        mockScreenService.createScreen.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(null as any)).rejects.toThrow('Validation error');
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockScreenService.createScreen.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(undefined as any)).rejects.toThrow('Validation error');
      });

      it('should handle empty layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [],
        };
        mockScreenService.createScreen.mockResolvedValue({
          message: 'Screen created successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.create(dto);

        // Assert
        expect(result.data).toEqual(mockScreen);
      });

      it('should handle null ownerId', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: null as any,
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockScreenService.createScreen.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(dto)).rejects.toThrow('Validation error');
      });
    });
  });

  describe('findAll', () => {
    describe('Success cases', () => {
      it('should return all screens', async () => {
        // Arrange
        mockScreenService.findAllScreen.mockResolvedValue({
          message: 'All screens fetched successfully',
          data: [mockScreen],
        });

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result).toEqual({
          message: 'All screens fetched successfully',
          data: [mockScreen],
        });
        expect(service.findAllScreen).toHaveBeenCalled();
      });

      it('should return empty array when no screens exist', async () => {
        // Arrange
        mockScreenService.findAllScreen.mockResolvedValue({
          message: 'All screens fetched successfully',
          data: [],
        });

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result.data).toEqual([]);
      });
    });

    describe('Edge cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockScreenService.findAllScreen.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a screen by id', async () => {
        // Arrange
        mockScreenService.findOne.mockResolvedValue({
          message: 'Screen fetched successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.findOne('screen-1');

        // Assert
        expect(result).toEqual({
          message: 'Screen fetched successfully',
          data: mockScreen,
        });
        expect(service.findOne).toHaveBeenCalledWith('screen-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockScreenService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockScreenService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne('')).rejects.toThrow('Invalid id');
      });

      it('should handle null id', async () => {
        // Arrange
        mockScreenService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne(null as any)).rejects.toThrow('Invalid id');
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockScreenService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne(undefined as any)).rejects.toThrow('Invalid id');
      });

      it('should handle invalid uuid format', async () => {
        // Arrange
        mockScreenService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne('invalid-uuid')).rejects.toThrow('Invalid id');
      });
    });
  });

  describe('update', () => {
    describe('Success cases', () => {
      it('should update a screen successfully', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenService.updateScreen.mockResolvedValue({
          message: 'Screen updated successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.update('screen-1', dto);

        // Assert
        expect(result).toEqual({
          message: 'Screen updated successfully',
          data: mockScreen,
        });
        expect(service.updateScreen).toHaveBeenCalledWith('screen-1', dto);
      });

      it('should update screen with partial data', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenService.updateScreen.mockResolvedValue({
          message: 'Screen updated successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.update('screen-1', dto);

        // Assert
        expect(service.updateScreen).toHaveBeenCalledWith('screen-1', dto);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenService.updateScreen.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.update('nonexistent', dto)).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto: UpdateScreenDTO = {};
        mockScreenService.updateScreen.mockResolvedValue({
          message: 'Screen updated successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.update('screen-1', dto);

        // Assert
        expect(service.updateScreen).toHaveBeenCalledWith('screen-1', dto);
      });

      it('should handle null dto', async () => {
        // Arrange
        mockScreenService.updateScreen.mockResolvedValue({
          message: 'Screen updated successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.update('screen-1', null as any);

        // Assert
        expect(service.updateScreen).toHaveBeenCalledWith('screen-1', null);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockScreenService.updateScreen.mockResolvedValue({
          message: 'Screen updated successfully',
          data: mockScreen,
        });

        // Act
        const result = await controller.update('screen-1', undefined as any);

        // Assert
        expect(service.updateScreen).toHaveBeenCalledWith('screen-1', undefined);
      });

      it('should handle empty string id', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenService.updateScreen.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.update('', dto)).rejects.toThrow('Invalid id');
      });

      it('should handle null id', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenService.updateScreen.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.update(null as any, dto)).rejects.toThrow('Invalid id');
      });
    });
  });

  describe('delete', () => {
    describe('Success cases', () => {
      it('should delete a screen successfully', async () => {
        // Arrange
        mockScreenService.deleteScreen.mockResolvedValue({
          message: 'Screen deleted successfully',
        });

        // Act
        const result = await controller.delete('screen-1');

        // Assert
        expect(result).toEqual({
          message: 'Screen deleted successfully',
        });
        expect(service.deleteScreen).toHaveBeenCalledWith('screen-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockScreenService.deleteScreen.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.delete('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockScreenService.deleteScreen.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.delete('')).rejects.toThrow('Invalid id');
      });

      it('should handle null id', async () => {
        // Arrange
        mockScreenService.deleteScreen.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.delete(null as any)).rejects.toThrow('Invalid id');
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockScreenService.deleteScreen.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.delete(undefined as any)).rejects.toThrow('Invalid id');
      });
    });
  });
});

