import { Test, TestingModule } from '@nestjs/testing';
import { ConcessionController } from './concession.controller';
import { ConcessionService } from './concession.service';
import { Concession, ConcessionStatus } from './entity/concession.entity';
import { ConcessionCategory } from './entity/concession-category.entity';
import { ConcessionOrder, ConcessionOrderStatus, PickupTime } from './entity/concession-order.entity';
import { CreateConcessionDto } from './dto/create-concession.dto';
import { UpdateConcessionDto } from './dto/update-concession.dto';
import { CreateConcessionOrderDto, ConcessionOrderItemDto } from './dto/create-concession-order.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('ConcessionController', () => {
  let controller: ConcessionController;
  let service: ConcessionService;

  const mockConcessionService = {
    createConcession: jest.fn(),
    getConcessionsByTheater: jest.fn(),
    getConcessionsByCategory: jest.fn(),
    updateConcession: jest.fn(),
    updateStock: jest.fn(),
    checkStockAvailability: jest.fn(),
    createCategory: jest.fn(),
    getCategories: jest.fn(),
    getCategoryById: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createConcessionOrder: jest.fn(),
    getConcessionOrdersByUser: jest.fn(),
    getConcessionOrdersByBooking: jest.fn(),
    updateOrderStatus: jest.fn(),
    markOrderAsPaid: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcessionController],
      providers: [
        {
          provide: ConcessionService,
          useValue: mockConcessionService,
        },
      ],
    }).compile();

    controller = module.get<ConcessionController>(ConcessionController);
    service = module.get<ConcessionService>(ConcessionService);

    jest.clearAllMocks();
  });

  describe('Concession Management', () => {
    describe('createConcession', () => {
      it('should create a concession successfully', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          minStockLevel: 10,
          status: ConcessionStatus.ACTIVE,
          imageUrl: 'https://example.com/popcorn.jpg',
          preparationTime: 15,
          isPreOrderable: true,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        const expectedResult: Concession = {
          id: 1,
          ...createDto,
          theaterOwner: { id: createDto.theaterOwnerId } as any,
          category: { id: createDto.categoryId } as any,
        } as any;

        mockConcessionService.createConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.createConcession(createDto);

        // Assert
        expect(service.createConcession).toHaveBeenCalledWith(createDto);
        expect(result).toEqual({
          message: 'Concession created successfully',
          data: expectedResult,
        });
      });

      it('should handle service errors during concession creation', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow(
          'Database error',
        );
      });

      it('should fail validation when name is missing', async () => {
        // Arrange
        const createDto = {
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        } as any;

        // Act & Assert
        // This would be caught by class-validator in real scenario
        // Testing the controller behavior when invalid data is passed
        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Validation failed'),
        );
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should fail validation when price is negative', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: -8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Invalid price'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should fail validation when stockQuantity is negative', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: -150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Invalid stock quantity'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should fail validation when categoryId is missing', async () => {
        // Arrange
        const createDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          theaterOwnerId: 'user-123',
        } as any;

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('categoryId is required'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should fail validation when theaterOwnerId is missing', async () => {
        // Arrange
        const createDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
        } as any;

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('theaterOwnerId is required'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should handle empty name', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: '',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Name cannot be empty'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should handle very long name', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'A'.repeat(1000),
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionService.createConcession.mockRejectedValue(
          new Error('Name too long'),
        );

        // Act & Assert
        await expect(controller.createConcession(createDto)).rejects.toThrow();
      });

      it('should handle zero price', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Free Sample',
          description: 'Free sample item',
          price: 0,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        const expectedResult: Concession = {
          id: 1,
          ...createDto,
          theaterOwner: { id: createDto.theaterOwnerId } as any,
          category: { id: createDto.categoryId } as any,
        } as any;

        mockConcessionService.createConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.createConcession(createDto);

        // Assert
        expect(result.data.price).toBe(0);
      });

      it('should handle decimal price correctly', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn Large',
          description: 'Fresh buttered popcorn',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        const expectedResult: Concession = {
          id: 1,
          ...createDto,
          theaterOwner: { id: createDto.theaterOwnerId } as any,
          category: { id: createDto.categoryId } as any,
        } as any;

        mockConcessionService.createConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.createConcession(createDto);

        // Assert
        expect(result.data.price).toBe(8.99);
      });
    });

    describe('getConcessionsByTheater', () => {
      it('should return concessions by theater ID', async () => {
        // Arrange
        const theaterId = 'theater-123';
        const expectedConcessions: Concession[] = [
          {
            id: 1,
            name: 'Popcorn',
            price: 8.99,
            stockQuantity: 150,
            theaterOwner: { id: theaterId } as any,
            category: { id: 1, name: 'Snacks' } as any,
          } as any,
        ];

        mockConcessionService.getConcessionsByTheater.mockResolvedValue(
          expectedConcessions,
        );

        // Act
        const result = await controller.getConcessionsByTheater(theaterId, {});

        // Assert
        expect(service.getConcessionsByTheater).toHaveBeenCalledWith(theaterId, {});
        expect(result).toEqual({
          message: 'Concessions retrieved successfully',
          data: expectedConcessions,
        });
      });

      it('should return empty array when no concessions found', async () => {
        // Arrange
        const theaterId = 'theater-123';
        mockConcessionService.getConcessionsByTheater.mockResolvedValue([]);

        // Act
        const result = await controller.getConcessionsByTheater(theaterId, {});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle invalid theater ID format', async () => {
        // Arrange
        const theaterId = 'invalid-id';
        mockConcessionService.getConcessionsByTheater.mockRejectedValue(
          new Error('Invalid theater ID'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByTheater(theaterId, {}),
        ).rejects.toThrow();
      });

      it('should handle empty theater ID', async () => {
        // Arrange
        const theaterId = '';
        mockConcessionService.getConcessionsByTheater.mockRejectedValue(
          new Error('Theater ID cannot be empty'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByTheater(theaterId, {}),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const theaterId = 'theater-123';
        mockConcessionService.getConcessionsByTheater.mockRejectedValue(
          new Error('Database connection failed'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByTheater(theaterId, {}),
        ).rejects.toThrow('Database connection failed');
      });
    });

    describe('getConcessionsByCategory', () => {
      it('should return concessions by category ID', async () => {
        // Arrange
        const categoryId = 1;
        const expectedConcessions: Concession[] = [
          {
            id: 1,
            name: 'Popcorn',
            price: 8.99,
            stockQuantity: 150,
            status: ConcessionStatus.ACTIVE,
            category: { id: categoryId, name: 'Snacks' } as any,
          } as any,
        ];

        mockConcessionService.getConcessionsByCategory.mockResolvedValue(
          expectedConcessions,
        );

        // Act
        const result = await controller.getConcessionsByCategory(categoryId, {});

        // Assert
        expect(service.getConcessionsByCategory).toHaveBeenCalledWith(
          categoryId,
          {},
        );
        expect(result).toEqual({
          message: 'Concessions retrieved successfully',
          data: expectedConcessions,
        });
      });

      it('should return empty array when no concessions in category', async () => {
        // Arrange
        const categoryId = 999;
        mockConcessionService.getConcessionsByCategory.mockResolvedValue([]);

        // Act
        const result = await controller.getConcessionsByCategory(categoryId, {});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle negative category ID', async () => {
        // Arrange
        const categoryId = -1;
        mockConcessionService.getConcessionsByCategory.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByCategory(categoryId, {}),
        ).rejects.toThrow();
      });

      it('should handle zero category ID', async () => {
        // Arrange
        const categoryId = 0;
        mockConcessionService.getConcessionsByCategory.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByCategory(categoryId, {}),
        ).rejects.toThrow();
      });

      it('should handle very large category ID', async () => {
        // Arrange
        const categoryId = Number.MAX_SAFE_INTEGER;
        mockConcessionService.getConcessionsByCategory.mockResolvedValue([]);

        // Act
        const result = await controller.getConcessionsByCategory(categoryId, {});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle non-numeric category ID', async () => {
        // Arrange
        const categoryId = NaN;
        mockConcessionService.getConcessionsByCategory.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.getConcessionsByCategory(categoryId, {}),
        ).rejects.toThrow();
      });
    });

    describe('updateConcession', () => {
      it('should update concession successfully', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = {
          name: 'Updated Popcorn',
          price: 9.99,
          stockQuantity: 200,
        };

        const expectedResult: Concession = {
          id: concessionId,
          name: 'Updated Popcorn',
          price: 9.99,
          stockQuantity: 200,
        } as any;

        mockConcessionService.updateConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateConcession(concessionId, updateDto);

        // Assert
        expect(service.updateConcession).toHaveBeenCalledWith(
          concessionId,
          updateDto,
        );
        expect(result).toEqual({
          message: 'Concession updated successfully',
          data: expectedResult,
        });
      });

      it('should return null when concession not found', async () => {
        // Arrange
        const concessionId = 999;
        const updateDto: UpdateConcessionDto = { name: 'Updated' };

        mockConcessionService.updateConcession.mockResolvedValue(null);

        // Act
        const result = await controller.updateConcession(concessionId, updateDto);

        // Assert
        expect(result.data).toBeNull();
      });

      it('should handle partial update with only name', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { name: 'Updated Name' };

        const expectedResult: Concession = {
          id: concessionId,
          name: 'Updated Name',
        } as any;

        mockConcessionService.updateConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateConcession(concessionId, updateDto);

        // Assert
        expect(result.data?.name).toBe('Updated Name');
      });

      it('should handle partial update with only price', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { price: 10.99 };

        const expectedResult: Concession = {
          id: concessionId,
          price: 10.99,
        } as any;

        mockConcessionService.updateConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateConcession(concessionId, updateDto);

        // Assert
        expect(result.data?.price).toBe(10.99);
      });

      it('should handle empty update DTO', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = {};

        const expectedResult: Concession = { id: concessionId } as any;

        mockConcessionService.updateConcession.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateConcession(concessionId, updateDto);

        // Assert
        expect(service.updateConcession).toHaveBeenCalledWith(
          concessionId,
          updateDto,
        );
      });

      it('should handle negative price in update', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { price: -10 };

        mockConcessionService.updateConcession.mockRejectedValue(
          new Error('Invalid price'),
        );

        // Act & Assert
        await expect(
          controller.updateConcession(concessionId, updateDto),
        ).rejects.toThrow();
      });

      it('should handle negative stock in update', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { stockQuantity: -50 };

        mockConcessionService.updateConcession.mockRejectedValue(
          new Error('Invalid stock quantity'),
        );

        // Act & Assert
        await expect(
          controller.updateConcession(concessionId, updateDto),
        ).rejects.toThrow();
      });

      it('should handle invalid status enum', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto = { status: 'INVALID_STATUS' } as any;

        mockConcessionService.updateConcession.mockRejectedValue(
          new Error('Invalid status'),
        );

        // Act & Assert
        await expect(
          controller.updateConcession(concessionId, updateDto),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { name: 'Updated' };

        mockConcessionService.updateConcession.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.updateConcession(concessionId, updateDto),
        ).rejects.toThrow('Database error');
      });
    });

    describe('updateStock', () => {
      it('should update stock successfully', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 50;

        mockConcessionService.updateStock.mockResolvedValue(undefined);

        // Act
        const result = await controller.updateStock(concessionId, quantity);

        // Assert
        expect(service.updateStock).toHaveBeenCalledWith(concessionId, quantity);
        expect(result).toEqual({
          message: 'Stock updated successfully',
        });
      });

      it('should handle negative quantity (stock reduction)', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = -20;

        mockConcessionService.updateStock.mockResolvedValue(undefined);

        // Act
        const result = await controller.updateStock(concessionId, quantity);

        // Assert
        expect(service.updateStock).toHaveBeenCalledWith(concessionId, quantity);
      });

      it('should handle zero quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 0;

        mockConcessionService.updateStock.mockResolvedValue(undefined);

        // Act
        const result = await controller.updateStock(concessionId, quantity);

        // Assert
        expect(service.updateStock).toHaveBeenCalledWith(concessionId, quantity);
      });

      it('should handle very large quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = Number.MAX_SAFE_INTEGER;

        mockConcessionService.updateStock.mockResolvedValue(undefined);

        // Act
        const result = await controller.updateStock(concessionId, quantity);

        // Assert
        expect(service.updateStock).toHaveBeenCalledWith(concessionId, quantity);
      });

      it('should handle concession not found', async () => {
        // Arrange
        const concessionId = 999;
        const quantity = 50;

        mockConcessionService.updateStock.mockRejectedValue(
          new Error('Concession not found'),
        );

        // Act & Assert
        await expect(
          controller.updateStock(concessionId, quantity),
        ).rejects.toThrow('Concession not found');
      });

      it('should handle service errors', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 50;

        mockConcessionService.updateStock.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.updateStock(concessionId, quantity),
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('Category Management', () => {
    describe('createCategory', () => {
      it('should create category successfully', async () => {
        // Arrange
        const createDto: CreateCategoryDto = {
          name: 'Beverages',
          description: 'Soft drinks and juices',
        };

        const expectedResult: ConcessionCategory = {
          id: 1,
          ...createDto,
          isActive: true,
          displayOrder: 0,
        } as any;

        mockConcessionService.createCategory.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.createCategory(createDto);

        // Assert
        expect(service.createCategory).toHaveBeenCalledWith(
          createDto.name,
          createDto.description,
        );
        expect(result).toEqual({
          message: 'Category created successfully',
          data: expectedResult,
        });
      });

      it('should handle empty name', async () => {
        // Arrange
        const createDto: CreateCategoryDto = {
          name: '',
          description: 'Description',
        };

        mockConcessionService.createCategory.mockRejectedValue(
          new Error('Name cannot be empty'),
        );

        // Act & Assert
        await expect(controller.createCategory(createDto)).rejects.toThrow();
      });

      it('should handle empty description', async () => {
        // Arrange
        const createDto: CreateCategoryDto = {
          name: 'Beverages',
          description: '',
        };

        mockConcessionService.createCategory.mockRejectedValue(
          new Error('Description cannot be empty'),
        );

        // Act & Assert
        await expect(controller.createCategory(createDto)).rejects.toThrow();
      });

      it('should handle very long name', async () => {
        // Arrange
        const createDto: CreateCategoryDto = {
          name: 'A'.repeat(1000),
          description: 'Description',
        };

        mockConcessionService.createCategory.mockRejectedValue(
          new Error('Name too long'),
        );

        // Act & Assert
        await expect(controller.createCategory(createDto)).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const createDto: CreateCategoryDto = {
          name: 'Beverages',
          description: 'Description',
        };

        mockConcessionService.createCategory.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(controller.createCategory(createDto)).rejects.toThrow();
      });
    });

    describe('getCategories', () => {
      it('should return all categories', async () => {
        // Arrange
        const expectedCategories: ConcessionCategory[] = [
          {
            id: 1,
            name: 'Beverages',
            description: 'Soft drinks',
            isActive: true,
            displayOrder: 1,
          },
          {
            id: 2,
            name: 'Snacks',
            description: 'Popcorn and chips',
            isActive: true,
            displayOrder: 2,
          },
        ] as any[];

        mockConcessionService.getCategories.mockResolvedValue(
          expectedCategories,
        );

        // Act
        const result = await controller.getCategories({});

        // Assert
        expect(service.getCategories).toHaveBeenCalledWith({});
        expect(result).toEqual({
          message: 'Categories retrieved successfully',
          data: expectedCategories,
        });
      });

      it('should return empty array when no categories exist', async () => {
        // Arrange
        mockConcessionService.getCategories.mockResolvedValue([]);

        // Act
        const result = await controller.getCategories({});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle service errors', async () => {
        // Arrange
        mockConcessionService.getCategories.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(controller.getCategories({})).rejects.toThrow();
      });
    });

    describe('getCategoryById', () => {
      it('should return category by ID', async () => {
        // Arrange
        const categoryId = 1;
        const expectedCategory: ConcessionCategory = {
          id: categoryId,
          name: 'Beverages',
          description: 'Soft drinks',
          isActive: true,
        } as any;

        mockConcessionService.getCategoryById.mockResolvedValue(
          expectedCategory,
        );

        // Act
        const result = await controller.getCategoryById(categoryId);

        // Assert
        expect(service.getCategoryById).toHaveBeenCalledWith(categoryId);
        expect(result).toEqual({
          message: 'Category retrieved successfully',
          data: expectedCategory,
        });
      });

      it('should return null when category not found', async () => {
        // Arrange
        const categoryId = 999;
        mockConcessionService.getCategoryById.mockResolvedValue(null);

        // Act
        const result = await controller.getCategoryById(categoryId);

        // Assert
        expect(result.data).toBeNull();
      });

      it('should handle negative category ID', async () => {
        // Arrange
        const categoryId = -1;
        mockConcessionService.getCategoryById.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.getCategoryById(categoryId),
        ).rejects.toThrow();
      });

      it('should handle zero category ID', async () => {
        // Arrange
        const categoryId = 0;
        mockConcessionService.getCategoryById.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.getCategoryById(categoryId),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const categoryId = 1;
        mockConcessionService.getCategoryById.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.getCategoryById(categoryId),
        ).rejects.toThrow();
      });
    });

    describe('updateCategory', () => {
      it('should update category successfully', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto: UpdateCategoryDto = {
          name: 'Updated Beverages',
          description: 'Updated description',
        };

        const expectedResult: ConcessionCategory = {
          id: categoryId,
          ...updateDto,
        } as any;

        mockConcessionService.updateCategory.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateCategory(categoryId, updateDto);

        // Assert
        expect(service.updateCategory).toHaveBeenCalledWith(
          categoryId,
          updateDto,
        );
        expect(result).toEqual({
          message: 'Category updated successfully',
          data: expectedResult,
        });
      });

      it('should return null when category not found', async () => {
        // Arrange
        const categoryId = 999;
        const updateDto: UpdateCategoryDto = { name: 'Updated' };

        mockConcessionService.updateCategory.mockResolvedValue(null);

        // Act
        const result = await controller.updateCategory(categoryId, updateDto);

        // Assert
        expect(result.data).toBeNull();
      });

      it('should handle partial update with only name', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto: UpdateCategoryDto = { name: 'Updated Name' };

        const expectedResult: ConcessionCategory = {
          id: categoryId,
          name: 'Updated Name',
        } as any;

        mockConcessionService.updateCategory.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateCategory(categoryId, updateDto);

        // Assert
        expect(result.data?.name).toBe('Updated Name');
      });

      it('should handle empty update DTO', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto: UpdateCategoryDto = {};

        const expectedResult: ConcessionCategory = { id: categoryId } as any;

        mockConcessionService.updateCategory.mockResolvedValue(expectedResult);

        // Act
        const result = await controller.updateCategory(categoryId, updateDto);

        // Assert
        expect(service.updateCategory).toHaveBeenCalledWith(
          categoryId,
          updateDto,
        );
      });

      it('should handle service errors', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto: UpdateCategoryDto = { name: 'Updated' };

        mockConcessionService.updateCategory.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.updateCategory(categoryId, updateDto),
        ).rejects.toThrow();
      });
    });

    describe('deleteCategory', () => {
      it('should delete category successfully', async () => {
        // Arrange
        const categoryId = 1;
        mockConcessionService.deleteCategory.mockResolvedValue(undefined);

        // Act
        const result = await controller.deleteCategory(categoryId);

        // Assert
        expect(service.deleteCategory).toHaveBeenCalledWith(categoryId);
        expect(result).toEqual({
          message: 'Category deleted successfully',
        });
      });

      it('should handle category not found', async () => {
        // Arrange
        const categoryId = 999;
        mockConcessionService.deleteCategory.mockRejectedValue(
          new Error('Category not found'),
        );

        // Act & Assert
        await expect(
          controller.deleteCategory(categoryId),
        ).rejects.toThrow('Category not found');
      });

      it('should handle negative category ID', async () => {
        // Arrange
        const categoryId = -1;
        mockConcessionService.deleteCategory.mockRejectedValue(
          new Error('Invalid category ID'),
        );

        // Act & Assert
        await expect(
          controller.deleteCategory(categoryId),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const categoryId = 1;
        mockConcessionService.deleteCategory.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.deleteCategory(categoryId),
        ).rejects.toThrow();
      });
    });
  });

  describe('Order Management', () => {
    describe('createConcessionOrder', () => {
      it('should create concession order successfully', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            {
              concessionId: 1,
              quantity: 2,
              customization: 'Extra butter',
            },
          ],
          pickupTime: PickupTime.BEFORE_MOVIE,
          showStartTime: new Date('2024-05-04T19:30:00Z'),
          specialInstructions: 'No ice',
        };

        const expectedResult: ConcessionOrder = {
          id: 1,
          booking: { id: createOrderDto.bookingId } as any,
          user: { id: createOrderDto.userId } as any,
          totalAmount: 17.98,
          status: ConcessionOrderStatus.PENDING,
        } as any;

        mockConcessionService.createConcessionOrder.mockResolvedValue(
          expectedResult,
        );

        // Act
        const result = await controller.createConcessionOrder(createOrderDto);

        // Assert
        expect(service.createConcessionOrder).toHaveBeenCalledWith(
          createOrderDto,
        );
        expect(result).toEqual({
          message: 'Concession order created successfully',
          data: expectedResult,
        });
      });

      it('should handle insufficient stock error', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            {
              concessionId: 1,
              quantity: 1000,
            },
          ],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Insufficient stock for concession 1'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Insufficient stock for concession 1');
      });

      it('should handle empty items array', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Items cannot be empty'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow();
      });

      it('should handle missing bookingId', async () => {
        // Arrange
        const createOrderDto = {
          userId: 'user-123',
          items: [{ concessionId: 1, quantity: 2 }],
        } as any;

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('bookingId is required'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow();
      });

      it('should handle missing userId', async () => {
        // Arrange
        const createOrderDto = {
          bookingId: 'booking-123',
          items: [{ concessionId: 1, quantity: 2 }],
        } as any;

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('userId is required'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow();
      });

      it('should handle negative quantity in items', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            {
              concessionId: 1,
              quantity: -2,
            },
          ],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Invalid quantity'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow();
      });

      it('should handle zero quantity in items', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            {
              concessionId: 1,
              quantity: 0,
            },
          ],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Invalid quantity'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow();
      });

      it('should handle concession not found error', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            {
              concessionId: 999,
              quantity: 2,
            },
          ],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Concession not found: 999'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Concession not found: 999');
      });

      it('should handle service errors', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [{ concessionId: 1, quantity: 2 }],
        };

        mockConcessionService.createConcessionOrder.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getOrdersByUser', () => {
      it('should return orders by user ID', async () => {
        // Arrange
        const userId = 'user-123';
        const expectedOrders: ConcessionOrder[] = [
          {
            id: 1,
            user: { id: userId } as any,
            totalAmount: 17.98,
            status: ConcessionOrderStatus.PENDING,
          } as any,
        ];

        mockConcessionService.getConcessionOrdersByUser.mockResolvedValue(
          expectedOrders,
        );

        // Act
        const result = await controller.getOrdersByUser(userId, {});

        // Assert
        expect(service.getConcessionOrdersByUser).toHaveBeenCalledWith(userId, {});
        expect(result).toEqual({
          message: 'Orders retrieved successfully',
          data: expectedOrders,
        });
      });

      it('should return empty array when no orders found', async () => {
        // Arrange
        const userId = 'user-123';
        mockConcessionService.getConcessionOrdersByUser.mockResolvedValue([]);

        // Act
        const result = await controller.getOrdersByUser(userId, {});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle empty user ID', async () => {
        // Arrange
        const userId = '';
        mockConcessionService.getConcessionOrdersByUser.mockRejectedValue(
          new Error('Invalid user ID'),
        );

        // Act & Assert
        await expect(controller.getOrdersByUser(userId, {})).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const userId = 'user-123';
        mockConcessionService.getConcessionOrdersByUser.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(controller.getOrdersByUser(userId, {})).rejects.toThrow();
      });
    });

    describe('getOrdersByBooking', () => {
      it('should return orders by booking ID', async () => {
        // Arrange
        const bookingId = 'booking-123';
        const expectedOrders: ConcessionOrder[] = [
          {
            id: 1,
            booking: { id: bookingId } as any,
            totalAmount: 17.98,
            status: ConcessionOrderStatus.PENDING,
          } as any,
        ];

        mockConcessionService.getConcessionOrdersByBooking.mockResolvedValue(
          expectedOrders,
        );

        // Act
        const result = await controller.getOrdersByBooking(bookingId, {});

        // Assert
        expect(service.getConcessionOrdersByBooking).toHaveBeenCalledWith(
          bookingId,
          {},
        );
        expect(result).toEqual({
          message: 'Orders retrieved successfully',
          data: expectedOrders,
        });
      });

      it('should return empty array when no orders found', async () => {
        // Arrange
        const bookingId = 'booking-123';
        mockConcessionService.getConcessionOrdersByBooking.mockResolvedValue([]);

        // Act
        const result = await controller.getOrdersByBooking(bookingId, {});

        // Assert
        expect(result.data).toEqual([]);
      });

      it('should handle empty booking ID', async () => {
        // Arrange
        const bookingId = '';
        mockConcessionService.getConcessionOrdersByBooking.mockRejectedValue(
          new Error('Invalid booking ID'),
        );

        // Act & Assert
        await expect(
          controller.getOrdersByBooking(bookingId, {}),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const bookingId = 'booking-123';
        mockConcessionService.getConcessionOrdersByBooking.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.getOrdersByBooking(bookingId, {}),
        ).rejects.toThrow();
      });
    });

    describe('updateOrderStatus', () => {
      it('should update order status successfully', async () => {
        // Arrange
        const orderId = 1;
        const status = ConcessionOrderStatus.PREPARING;

        mockConcessionService.updateOrderStatus.mockResolvedValue(undefined);

        // Act
        const result = await controller.updateOrderStatus(orderId, status);

        // Assert
        expect(service.updateOrderStatus).toHaveBeenCalledWith(orderId, status);
        expect(result).toEqual({
          message: 'Order status updated successfully',
        });
      });

      it('should handle order not found', async () => {
        // Arrange
        const orderId = 999;
        const status = ConcessionOrderStatus.PREPARING;

        mockConcessionService.updateOrderStatus.mockRejectedValue(
          new Error('Order not found'),
        );

        // Act & Assert
        await expect(
          controller.updateOrderStatus(orderId, status),
        ).rejects.toThrow('Order not found');
      });

      it('should handle invalid status', async () => {
        // Arrange
        const orderId = 1;
        const status = 'INVALID_STATUS' as any;

        mockConcessionService.updateOrderStatus.mockRejectedValue(
          new Error('Invalid status'),
        );

        // Act & Assert
        await expect(
          controller.updateOrderStatus(orderId, status),
        ).rejects.toThrow();
      });

      it('should handle negative order ID', async () => {
        // Arrange
        const orderId = -1;
        const status = ConcessionOrderStatus.PREPARING;

        mockConcessionService.updateOrderStatus.mockRejectedValue(
          new Error('Invalid order ID'),
        );

        // Act & Assert
        await expect(
          controller.updateOrderStatus(orderId, status),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const orderId = 1;
        const status = ConcessionOrderStatus.PREPARING;

        mockConcessionService.updateOrderStatus.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.updateOrderStatus(orderId, status),
        ).rejects.toThrow();
      });
    });

    describe('markOrderAsPaid', () => {
      it('should mark order as paid successfully', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = 'payment-123';

        mockConcessionService.markOrderAsPaid.mockResolvedValue(undefined);

        // Act
        const result = await controller.markOrderAsPaid(
          orderId,
          paymentReference,
        );

        // Assert
        expect(service.markOrderAsPaid).toHaveBeenCalledWith(
          orderId,
          paymentReference,
        );
        expect(result).toEqual({
          message: 'Order marked as paid successfully',
        });
      });

      it('should handle order not found', async () => {
        // Arrange
        const orderId = 999;
        const paymentReference = 'payment-123';

        mockConcessionService.markOrderAsPaid.mockRejectedValue(
          new Error('Order not found'),
        );

        // Act & Assert
        await expect(
          controller.markOrderAsPaid(orderId, paymentReference),
        ).rejects.toThrow('Order not found');
      });

      it('should handle empty payment reference', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = '';

        mockConcessionService.markOrderAsPaid.mockResolvedValue(undefined);

        // Act
        const result = await controller.markOrderAsPaid(
          orderId,
          paymentReference,
        );

        // Assert
        expect(service.markOrderAsPaid).toHaveBeenCalledWith(
          orderId,
          paymentReference,
        );
      });

      it('should handle null payment reference', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = null as any;

        mockConcessionService.markOrderAsPaid.mockRejectedValue(
          new Error('Payment reference cannot be null'),
        );

        // Act & Assert
        await expect(
          controller.markOrderAsPaid(orderId, paymentReference),
        ).rejects.toThrow();
      });

      it('should handle negative order ID', async () => {
        // Arrange
        const orderId = -1;
        const paymentReference = 'payment-123';

        mockConcessionService.markOrderAsPaid.mockRejectedValue(
          new Error('Invalid order ID'),
        );

        // Act & Assert
        await expect(
          controller.markOrderAsPaid(orderId, paymentReference),
        ).rejects.toThrow();
      });

      it('should handle service errors', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = 'payment-123';

        mockConcessionService.markOrderAsPaid.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.markOrderAsPaid(orderId, paymentReference),
        ).rejects.toThrow();
      });
    });
  });

  describe('Stock Check', () => {
    describe('checkStockAvailability', () => {
      it('should return true when stock is available', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 5;

        mockConcessionService.checkStockAvailability.mockResolvedValue(true);

        // Act
        const result = await controller.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(service.checkStockAvailability).toHaveBeenCalledWith(
          concessionId,
          quantity,
        );
        expect(result).toEqual({
          message: 'Stock availability checked successfully',
          data: { concessionId, quantity, isAvailable: true },
        });
      });

      it('should return false when stock is not available', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 1000;

        mockConcessionService.checkStockAvailability.mockResolvedValue(false);

        // Act
        const result = await controller.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result.data.isAvailable).toBe(false);
      });

      it('should handle zero quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 0;

        mockConcessionService.checkStockAvailability.mockResolvedValue(true);

        // Act
        const result = await controller.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result.data.isAvailable).toBe(true);
      });

      it('should handle negative quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = -5;

        mockConcessionService.checkStockAvailability.mockRejectedValue(
          new Error('Invalid quantity'),
        );

        // Act & Assert
        await expect(
          controller.checkStockAvailability(concessionId, quantity),
        ).rejects.toThrow();
      });

      it('should handle concession not found', async () => {
        // Arrange
        const concessionId = 999;
        const quantity = 5;

        mockConcessionService.checkStockAvailability.mockResolvedValue(false);

        // Act
        const result = await controller.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result.data.isAvailable).toBe(false);
      });

      it('should handle negative concession ID', async () => {
        // Arrange
        const concessionId = -1;
        const quantity = 5;

        mockConcessionService.checkStockAvailability.mockRejectedValue(
          new Error('Invalid concession ID'),
        );

        // Act & Assert
        await expect(
          controller.checkStockAvailability(concessionId, quantity),
        ).rejects.toThrow();
      });

      it('should handle zero concession ID', async () => {
        // Arrange
        const concessionId = 0;
        const quantity = 5;

        mockConcessionService.checkStockAvailability.mockRejectedValue(
          new Error('Invalid concession ID'),
        );

        // Act & Assert
        await expect(
          controller.checkStockAvailability(concessionId, quantity),
        ).rejects.toThrow();
      });

      it('should handle very large quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = Number.MAX_SAFE_INTEGER;

        mockConcessionService.checkStockAvailability.mockResolvedValue(false);

        // Act
        const result = await controller.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result.data.isAvailable).toBe(false);
      });

      it('should handle service errors', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 5;

        mockConcessionService.checkStockAvailability.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          controller.checkStockAvailability(concessionId, quantity),
        ).rejects.toThrow();
      });
    });
  });
});
