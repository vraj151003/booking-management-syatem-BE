import { Test, TestingModule } from '@nestjs/testing';
import { ShowController } from './show.controller';
import { ShowService } from './show.service';
import { CreateShowDto } from './dto/create-show.dto';

describe('ShowController', () => {
  let controller: ShowController;
  let service: ShowService;

  const mockShow = {
    id: 'show-1',
    movie: { id: 'movie-1', name: 'Test Movie' },
    screen: { id: 'screen-1', name: 'Screen 1' },
    showDate: '2024-01-01',
    startTime: '10:00',
    endTime: '12:00',
    pricing: { GOLD: 300 },
    isActive: true,
  };

  const mockShowService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    getSeatAvailability: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowController],
      providers: [
        {
          provide: ShowService,
          useValue: mockShowService,
        },
      ],
    }).compile();

    controller = module.get<ShowController>(ShowController);
    service = module.get<ShowService>(ShowService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Success cases', () => {
      it('should create a show successfully', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockShowService.create.mockResolvedValue({
          message: 'Show created successfully',
          data: mockShow,
        });

        // Act
        const result = await controller.create(dto);

        // Assert
        expect(result).toEqual({
          message: 'Show created successfully',
          data: mockShow,
        });
        expect(service.create).toHaveBeenCalledWith(dto);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockShowService.create.mockRejectedValue(new Error('Service error'));

        // Act & Assert
        await expect(controller.create(dto)).rejects.toThrow('Service error');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto = {} as CreateShowDto;
        mockShowService.create.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(dto)).rejects.toThrow('Validation error');
      });

      it('should handle null dto', async () => {
        // Arrange
        mockShowService.create.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(null as any)).rejects.toThrow('Validation error');
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockShowService.create.mockRejectedValue(new Error('Validation error'));

        // Act & Assert
        await expect(controller.create(undefined as any)).rejects.toThrow('Validation error');
      });
    });
  });

  describe('findAll', () => {
    describe('Success cases', () => {
      it('should return all shows', async () => {
        // Arrange
        mockShowService.findAll.mockResolvedValue({
          message: 'Shows fetched successfully',
          data: [mockShow],
        });

        // Act
        const result = await controller.findAll();

        // Assert
        expect(result).toEqual({
          message: 'Shows fetched successfully',
          data: [mockShow],
        });
        expect(service.findAll).toHaveBeenCalled();
      });

      it('should return empty array when no shows exist', async () => {
        // Arrange
        mockShowService.findAll.mockResolvedValue({
          message: 'Shows fetched successfully',
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
        mockShowService.findAll.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(controller.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a show by id', async () => {
        // Arrange
        mockShowService.findOne.mockResolvedValue({
          message: 'Show fetched successfully',
          data: mockShow,
        });

        // Act
        const result = await controller.findOne('show-1');

        // Assert
        expect(result).toEqual({
          message: 'Show fetched successfully',
          data: mockShow,
        });
        expect(service.findOne).toHaveBeenCalledWith('show-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockShowService.findOne.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.findOne('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockShowService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne('')).rejects.toThrow('Invalid id');
      });

      it('should handle null id', async () => {
        // Arrange
        mockShowService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne(null as any)).rejects.toThrow('Invalid id');
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockShowService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne(undefined as any)).rejects.toThrow('Invalid id');
      });

      it('should handle invalid uuid format', async () => {
        // Arrange
        mockShowService.findOne.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.findOne('invalid-uuid')).rejects.toThrow('Invalid id');
      });
    });
  });

  describe('getSeatAvailability', () => {
    describe('Success cases', () => {
      it('should return seat availability for a show', async () => {
        // Arrange
        const mockSeats = [
          {
            id: 'seat-1',
            seatNumber: 'A1',
            type: 'GOLD',
            price: 300,
            isBooked: false,
          },
        ];
        mockShowService.getSeatAvailability.mockResolvedValue(mockSeats);

        // Act
        const result = await controller.getSeatAvailability('show-1');

        // Assert
        expect(result).toEqual(mockSeats);
        expect(service.getSeatAvailability).toHaveBeenCalledWith('show-1');
      });

      it('should return empty array when no seats', async () => {
        // Arrange
        mockShowService.getSeatAvailability.mockResolvedValue([]);

        // Act
        const result = await controller.getSeatAvailability('show-1');

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockShowService.getSeatAvailability.mockRejectedValue(new Error('Show not found'));

        // Act & Assert
        await expect(controller.getSeatAvailability('nonexistent')).rejects.toThrow('Show not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string showId', async () => {
        // Arrange
        mockShowService.getSeatAvailability.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.getSeatAvailability('')).rejects.toThrow('Invalid id');
      });

      it('should handle null showId', async () => {
        // Arrange
        mockShowService.getSeatAvailability.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.getSeatAvailability(null as any)).rejects.toThrow('Invalid id');
      });
    });
  });

  describe('delete', () => {
    describe('Success cases', () => {
      it('should delete a show successfully', async () => {
        // Arrange
        mockShowService.delete.mockResolvedValue({
          message: 'Show deleted successfully',
        });

        // Act
        const result = await controller.delete('show-1');

        // Assert
        expect(result).toEqual({
          message: 'Show deleted successfully',
        });
        expect(service.delete).toHaveBeenCalledWith('show-1');
      });
    });

    describe('Failure cases', () => {
      it('should handle service errors', async () => {
        // Arrange
        mockShowService.delete.mockRejectedValue(new Error('Not found'));

        // Act & Assert
        await expect(controller.delete('nonexistent')).rejects.toThrow('Not found');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockShowService.delete.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.delete('')).rejects.toThrow('Invalid id');
      });

      it('should handle null id', async () => {
        // Arrange
        mockShowService.delete.mockRejectedValue(new Error('Invalid id'));

        // Act & Assert
        await expect(controller.delete(null as any)).rejects.toThrow('Invalid id');
      });
    });
  });
});

