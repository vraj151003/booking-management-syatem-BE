import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConcessionService } from './concession.service';
import { Concession, ConcessionStatus } from './entity/concession.entity';
import { ConcessionCategory } from './entity/concession-category.entity';
import { ConcessionOrder, ConcessionOrderStatus } from './entity/concession-order.entity';
import { ConcessionOrderItem } from './entity/concession-order-item.entity';
import { CreateConcessionDto } from './dto/create-concession.dto';
import { UpdateConcessionDto } from './dto/update-concession.dto';
import { CreateConcessionOrderDto } from './dto/create-concession-order.dto';

describe('ConcessionService', () => {
  let service: ConcessionService;
  let concessionRepo: Repository<Concession>;
  let categoryRepo: Repository<ConcessionCategory>;
  let orderRepo: Repository<ConcessionOrder>;
  let orderItemRepo: Repository<ConcessionOrderItem>;

  const mockConcessionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
  };

  const mockCategoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockOrderRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockOrderItemRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcessionService,
        {
          provide: getRepositoryToken(Concession),
          useValue: mockConcessionRepo,
        },
        {
          provide: getRepositoryToken(ConcessionCategory),
          useValue: mockCategoryRepo,
        },
        {
          provide: getRepositoryToken(ConcessionOrder),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(ConcessionOrderItem),
          useValue: mockOrderItemRepo,
        },
      ],
    }).compile();

    service = module.get<ConcessionService>(ConcessionService);
    concessionRepo = module.get<Repository<Concession>>(
      getRepositoryToken(Concession),
    );
    categoryRepo = module.get<Repository<ConcessionCategory>>(
      getRepositoryToken(ConcessionCategory),
    );
    orderRepo = module.get<Repository<ConcessionOrder>>(
      getRepositoryToken(ConcessionOrder),
    );
    orderItemRepo = module.get<Repository<ConcessionOrderItem>>(
      getRepositoryToken(ConcessionOrderItem),
    );

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

        const expectedConcession = { id: 1, ...createDto };

        mockConcessionRepo.create.mockReturnValue(expectedConcession);
        mockConcessionRepo.save.mockResolvedValue(expectedConcession);

        // Act
        const result = await service.createConcession(createDto);

        // Assert
        expect(concessionRepo.create).toHaveBeenCalledWith(createDto);
        expect(concessionRepo.save).toHaveBeenCalledWith(expectedConcession);
        expect(result).toEqual(expectedConcession);
      });

      it('should handle database errors during creation', async () => {
        // Arrange
        const createDto: CreateConcessionDto = {
          name: 'Popcorn',
          description: 'Description',
          price: 8.99,
          stockQuantity: 150,
          categoryId: 1,
          theaterOwnerId: 'user-123',
        };

        mockConcessionRepo.create.mockReturnValue(createDto);
        mockConcessionRepo.save.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.createConcession(createDto)).rejects.toThrow(
          'Database error',
        );
      });

      it('should handle null DTO', async () => {
        // Arrange
        const createDto = null as any;

        mockConcessionRepo.create.mockReturnValue(createDto);
        mockConcessionRepo.save.mockRejectedValue(
          new Error('Invalid data'),
        );

        // Act & Assert
        await expect(service.createConcession(createDto)).rejects.toThrow();
      });
    });

    describe('getConcessionsByTheater', () => {
      it('should return concessions by theater owner ID', async () => {
        // Arrange
        const theaterOwnerId = 'theater-123';
        const expectedConcessions = [
          {
            id: 1,
            name: 'Popcorn',
            theaterOwner: { id: theaterOwnerId },
            category: { id: 1, name: 'Snacks' },
          },
        ];

        mockConcessionRepo.find.mockResolvedValue(expectedConcessions);

        // Act
        const result = await service.getConcessionsByTheater(theaterOwnerId);

        // Assert
        expect(concessionRepo.find).toHaveBeenCalledWith({
          where: { theaterOwner: { id: theaterOwnerId } },
          relations: ['category'],
        });
        expect(result).toEqual(expectedConcessions);
      });

      it('should return empty array when no concessions found', async () => {
        // Arrange
        const theaterOwnerId = 'theater-123';
        mockConcessionRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionsByTheater(theaterOwnerId);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle empty theater owner ID', async () => {
        // Arrange
        const theaterOwnerId = '';
        mockConcessionRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionsByTheater(theaterOwnerId);

        // Assert
        expect(concessionRepo.find).toHaveBeenCalledWith({
          where: { theaterOwner: { id: '' } },
          relations: ['category'],
        });
      });

      it('should handle database errors', async () => {
        // Arrange
        const theaterOwnerId = 'theater-123';
        mockConcessionRepo.find.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.getConcessionsByTheater(theaterOwnerId),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getConcessionsByCategory', () => {
      it('should return active concessions by category ID', async () => {
        // Arrange
        const categoryId = 1;
        const expectedConcessions = [
          {
            id: 1,
            name: 'Popcorn',
            status: ConcessionStatus.ACTIVE,
            category: { id: categoryId, name: 'Snacks' },
          },
        ];

        mockConcessionRepo.find.mockResolvedValue(expectedConcessions);

        // Act
        const result = await service.getConcessionsByCategory(categoryId);

        // Assert
        expect(concessionRepo.find).toHaveBeenCalledWith({
          where: { status: ConcessionStatus.ACTIVE },
          relations: ['category'],
        });
        expect(result).toEqual(expectedConcessions);
      });

      it('should return empty array when no active concessions', async () => {
        // Arrange
        const categoryId = 1;
        mockConcessionRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionsByCategory(categoryId);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle negative category ID', async () => {
        // Arrange
        const categoryId = -1;
        mockConcessionRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionsByCategory(categoryId);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        // Arrange
        const categoryId = 1;
        mockConcessionRepo.find.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.getConcessionsByCategory(categoryId),
        ).rejects.toThrow('Database error');
      });
    });

    describe('updateConcession', () => {
      it('should update concession successfully', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = {
          name: 'Updated Popcorn',
          price: 9.99,
        };

        const updatedConcession = {
          id: concessionId,
          ...updateDto,
        };

        mockConcessionRepo.update.mockResolvedValue(undefined);
        mockConcessionRepo.findOne.mockResolvedValue(updatedConcession);

        // Act
        const result = await service.updateConcession(concessionId, updateDto);

        // Assert
        expect(concessionRepo.update).toHaveBeenCalledWith(
          concessionId,
          updateDto,
        );
        expect(concessionRepo.findOne).toHaveBeenCalledWith({
          where: { id: concessionId },
        });
        expect(result).toEqual(updatedConcession);
      });

      it('should return null when concession not found', async () => {
        // Arrange
        const concessionId = 999;
        const updateDto: UpdateConcessionDto = { name: 'Updated' };

        mockConcessionRepo.update.mockResolvedValue(undefined);
        mockConcessionRepo.findOne.mockResolvedValue(null);

        // Act
        const result = await service.updateConcession(concessionId, updateDto);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle empty update DTO', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = {};

        const existingConcession = { id: concessionId, name: 'Popcorn' };

        mockConcessionRepo.update.mockResolvedValue(undefined);
        mockConcessionRepo.findOne.mockResolvedValue(existingConcession);

        // Act
        const result = await service.updateConcession(concessionId, updateDto);

        // Assert
        expect(result).toEqual(existingConcession);
      });

      it('should handle database errors during update', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { name: 'Updated' };

        mockConcessionRepo.update.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.updateConcession(concessionId, updateDto),
        ).rejects.toThrow('Database error');
      });

      it('should handle database errors during find', async () => {
        // Arrange
        const concessionId = 1;
        const updateDto: UpdateConcessionDto = { name: 'Updated' };

        mockConcessionRepo.update.mockResolvedValue(undefined);
        mockConcessionRepo.findOne.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.updateConcession(concessionId, updateDto),
        ).rejects.toThrow('Database error');
      });
    });

    describe('updateStock', () => {
      it('should increment stock successfully', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 50;

        mockConcessionRepo.increment.mockResolvedValue(undefined);

        // Act
        await service.updateStock(concessionId, quantity);

        // Assert
        expect(concessionRepo.increment).toHaveBeenCalledWith(
          { id: concessionId },
          'stockQuantity',
          quantity,
        );
      });

      it('should decrement stock (negative quantity)', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = -20;

        mockConcessionRepo.increment.mockResolvedValue(undefined);

        // Act
        await service.updateStock(concessionId, quantity);

        // Assert
        expect(concessionRepo.increment).toHaveBeenCalledWith(
          { id: concessionId },
          'stockQuantity',
          quantity,
        );
      });

      it('should handle zero quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 0;

        mockConcessionRepo.increment.mockResolvedValue(undefined);

        // Act
        await service.updateStock(concessionId, quantity);

        // Assert
        expect(concessionRepo.increment).toHaveBeenCalledWith(
          { id: concessionId },
          'stockQuantity',
          quantity,
        );
      });

      it('should handle database errors', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 50;

        mockConcessionRepo.increment.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(service.updateStock(concessionId, quantity)).rejects.toThrow(
          'Database error',
        );
      });
    });

    describe('checkStockAvailability', () => {
      it('should return true when stock is available', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 5;

        const concession = {
          id: concessionId,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when stock is insufficient', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 150;

        const concession = {
          id: concessionId,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when concession is inactive', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 5;

        const concession = {
          id: concessionId,
          stockQuantity: 100,
          status: ConcessionStatus.INACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(false);
      });

      it('should return false when concession not found', async () => {
        // Arrange
        const concessionId = 999;
        const quantity = 5;

        mockConcessionRepo.findOne.mockResolvedValue(null);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(false);
      });

      it('should return true when quantity equals stock', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 100;

        const concession = {
          id: concessionId,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(true);
      });

      it('should handle zero quantity', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 0;

        const concession = {
          id: concessionId,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act
        const result = await service.checkStockAvailability(
          concessionId,
          quantity,
        );

        // Assert
        expect(result).toBe(true);
      });

      it('should handle database errors', async () => {
        // Arrange
        const concessionId = 1;
        const quantity = 5;

        mockConcessionRepo.findOne.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.checkStockAvailability(concessionId, quantity),
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('Category Management', () => {
    describe('createCategory', () => {
      it('should create category successfully', async () => {
        // Arrange
        const name = 'Beverages';
        const description = 'Soft drinks and juices';

        const expectedCategory = {
          id: 1,
          name,
          description,
          isActive: true,
          displayOrder: 0,
        };

        mockCategoryRepo.create.mockReturnValue(expectedCategory);
        mockCategoryRepo.save.mockResolvedValue(expectedCategory);

        // Act
        const result = await service.createCategory(name, description);

        // Assert
        expect(categoryRepo.create).toHaveBeenCalledWith({
          name,
          description,
        });
        expect(categoryRepo.save).toHaveBeenCalledWith(expectedCategory);
        expect(result).toEqual(expectedCategory);
      });

      it('should handle empty name', async () => {
        // Arrange
        const name = '';
        const description = 'Description';

        const expectedCategory = { id: 1, name, description };

        mockCategoryRepo.create.mockReturnValue(expectedCategory);
        mockCategoryRepo.save.mockResolvedValue(expectedCategory);

        // Act
        const result = await service.createCategory(name, description);

        // Assert
        expect(result.name).toBe('');
      });

      it('should handle empty description', async () => {
        // Arrange
        const name = 'Beverages';
        const description = '';

        const expectedCategory = { id: 1, name, description };

        mockCategoryRepo.create.mockReturnValue(expectedCategory);
        mockCategoryRepo.save.mockResolvedValue(expectedCategory);

        // Act
        const result = await service.createCategory(name, description);

        // Assert
        expect(result.description).toBe('');
      });

      it('should handle database errors', async () => {
        // Arrange
        const name = 'Beverages';
        const description = 'Description';

        mockCategoryRepo.create.mockReturnValue({ name, description });
        mockCategoryRepo.save.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.createCategory(name, description),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getCategories', () => {
      it('should return active categories ordered by displayOrder', async () => {
        // Arrange
        const expectedCategories = [
          { id: 1, name: 'Beverages', isActive: true, displayOrder: 1 },
          { id: 2, name: 'Snacks', isActive: true, displayOrder: 2 },
        ];

        mockCategoryRepo.find.mockResolvedValue(expectedCategories);

        // Act
        const result = await service.getCategories();

        // Assert
        expect(categoryRepo.find).toHaveBeenCalledWith({
          where: { isActive: true },
          order: { displayOrder: 'ASC' },
        });
        expect(result).toEqual(expectedCategories);
      });

      it('should return empty array when no categories', async () => {
        // Arrange
        mockCategoryRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getCategories();

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        // Arrange
        mockCategoryRepo.find.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(service.getCategories()).rejects.toThrow(
          'Database error',
        );
      });
    });

    describe('getCategoryById', () => {
      it('should return category by ID', async () => {
        // Arrange
        const categoryId = 1;
        const expectedCategory = {
          id: categoryId,
          name: 'Beverages',
          isActive: true,
        };

        mockCategoryRepo.findOne.mockResolvedValue(expectedCategory);

        // Act
        const result = await service.getCategoryById(categoryId);

        // Assert
        expect(categoryRepo.findOne).toHaveBeenCalledWith({
          where: { id: categoryId },
        });
        expect(result).toEqual(expectedCategory);
      });

      it('should return null when category not found', async () => {
        // Arrange
        const categoryId = 999;
        mockCategoryRepo.findOne.mockResolvedValue(null);

        // Act
        const result = await service.getCategoryById(categoryId);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        // Arrange
        const categoryId = 1;
        mockCategoryRepo.findOne.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.getCategoryById(categoryId),
        ).rejects.toThrow('Database error');
      });
    });

    describe('updateCategory', () => {
      it('should update category successfully', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto = {
          name: 'Updated Beverages',
          description: 'Updated description',
        };

        const updatedCategory = {
          id: categoryId,
          ...updateDto,
        };

        mockCategoryRepo.update.mockResolvedValue(undefined);
        mockCategoryRepo.findOne.mockResolvedValue(updatedCategory);

        // Act
        const result = await service.updateCategory(categoryId, updateDto);

        // Assert
        expect(categoryRepo.update).toHaveBeenCalledWith(categoryId, updateDto);
        expect(categoryRepo.findOne).toHaveBeenCalledWith({
          where: { id: categoryId },
        });
        expect(result).toEqual(updatedCategory);
      });

      it('should return null when category not found', async () => {
        // Arrange
        const categoryId = 999;
        const updateDto = { name: 'Updated' };

        mockCategoryRepo.update.mockResolvedValue(undefined);
        mockCategoryRepo.findOne.mockResolvedValue(null);

        // Act
        const result = await service.updateCategory(categoryId, updateDto);

        // Assert
        expect(result).toBeNull();
      });

      it('should handle empty update DTO', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto = {};

        const existingCategory = { id: categoryId, name: 'Beverages' };

        mockCategoryRepo.update.mockResolvedValue(undefined);
        mockCategoryRepo.findOne.mockResolvedValue(existingCategory);

        // Act
        const result = await service.updateCategory(categoryId, updateDto);

        // Assert
        expect(result).toEqual(existingCategory);
      });

      it('should handle database errors', async () => {
        // Arrange
        const categoryId = 1;
        const updateDto = { name: 'Updated' };

        mockCategoryRepo.update.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.updateCategory(categoryId, updateDto),
        ).rejects.toThrow('Database error');
      });
    });

    describe('deleteCategory', () => {
      it('should soft delete category by setting isActive to false', async () => {
        // Arrange
        const categoryId = 1;

        mockCategoryRepo.update.mockResolvedValue(undefined);

        // Act
        await service.deleteCategory(categoryId);

        // Assert
        expect(categoryRepo.update).toHaveBeenCalledWith(categoryId, {
          isActive: false,
        });
      });

      it('should handle database errors', async () => {
        // Arrange
        const categoryId = 1;

        mockCategoryRepo.update.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(service.deleteCategory(categoryId)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('Order Management', () => {
    describe('createConcessionOrder', () => {
      it('should create order successfully with single item', async () => {
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
          pickupTime: 'BEFORE_MOVIE' as any,
          showStartTime: new Date('2024-05-04T19:30:00Z'),
          specialInstructions: 'No ice',
        };

        const concession = {
          id: 1,
          price: 8.99,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        const order = {
          id: 1,
          booking: { id: createOrderDto.bookingId },
          user: { id: createOrderDto.userId },
          totalAmount: 0,
          pickupTime: createOrderDto.pickupTime,
          showStartTime: createOrderDto.showStartTime,
          specialInstructions: createOrderDto.specialInstructions,
        };

        const savedOrder = { ...order, id: 1 };

        // Mock checkStockAvailability to return true
        jest.spyOn(service, 'checkStockAvailability').mockResolvedValue(true);

        mockConcessionRepo.findOne.mockResolvedValue(concession);
        mockConcessionRepo.increment.mockResolvedValue(undefined);
        mockOrderRepo.create.mockReturnValue(order);
        mockOrderRepo.save.mockResolvedValue(savedOrder);
        mockOrderItemRepo.create.mockReturnValue({});
        mockOrderItemRepo.save.mockResolvedValue({});

        // Act
        const result = await service.createConcessionOrder(createOrderDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.totalAmount).toBeGreaterThan(0);
      });

      it('should throw error when stock is insufficient', async () => {
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

        const concession = {
          id: 1,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);

        // Act & Assert
        await expect(
          service.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Insufficient stock for concession 1');
      });

      it('should throw error when concession not found', async () => {
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

        // Mock checkStockAvailability to return false first (simulating not found)
        jest.spyOn(service, 'checkStockAvailability').mockResolvedValue(false);

        // Act & Assert
        await expect(
          service.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Insufficient stock for concession 999');
      });

      it('should handle multiple items in order', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [
            { concessionId: 1, quantity: 2 },
            { concessionId: 2, quantity: 1 },
          ],
        };

        const concession1 = {
          id: 1,
          price: 8.99,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        const concession2 = {
          id: 2,
          price: 5.99,
          stockQuantity: 50,
          status: ConcessionStatus.ACTIVE,
        };

        const order = {
          id: 1,
          booking: { id: createOrderDto.bookingId },
          user: { id: createOrderDto.userId },
          totalAmount: 0,
        };

        // Mock checkStockAvailability to return true for both items
        jest.spyOn(service, 'checkStockAvailability')
          .mockResolvedValueOnce(true)
          .mockResolvedValueOnce(true);

        mockConcessionRepo.findOne
          .mockResolvedValueOnce(concession1)
          .mockResolvedValueOnce(concession2);
        mockConcessionRepo.increment.mockResolvedValue(undefined);
        mockOrderRepo.create.mockReturnValue(order);
        mockOrderRepo.save.mockResolvedValue({ ...order, id: 1 });
        mockOrderItemRepo.create.mockReturnValue({});
        mockOrderItemRepo.save.mockResolvedValue({});

        // Act
        const result = await service.createConcessionOrder(createOrderDto);

        // Assert
        expect(result).toBeDefined();
        expect(mockConcessionRepo.findOne).toHaveBeenCalledTimes(2);
      });

      it('should handle empty items array', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [],
        };

        // Act & Assert
        const result = await service.createConcessionOrder(createOrderDto);
        expect(result.totalAmount).toBe(0);
      });

      it('should calculate preparation time', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [{ concessionId: 1, quantity: 2 }],
        };

        const concession = {
          id: 1,
          price: 8.99,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        const order = {
          id: 1,
          booking: { id: createOrderDto.bookingId },
          user: { id: createOrderDto.userId },
          totalAmount: 0,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);
        mockConcessionRepo.increment.mockResolvedValue(undefined);
        mockOrderRepo.create.mockReturnValue(order);
        mockOrderRepo.save.mockResolvedValue({ ...order, id: 1 });
        mockOrderItemRepo.create.mockReturnValue({});
        mockOrderItemRepo.save.mockResolvedValue({});

        // Act
        const result = await service.createConcessionOrder(createOrderDto);

        // Assert
        expect(result.estimatedPreparationTime).toBeDefined();
      });

      it('should update stock after order creation', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [{ concessionId: 1, quantity: 2 }],
        };

        const concession = {
          id: 1,
          price: 8.99,
          stockQuantity: 100,
          status: ConcessionStatus.ACTIVE,
        };

        const order = {
          id: 1,
          booking: { id: createOrderDto.bookingId },
          user: { id: createOrderDto.userId },
          totalAmount: 0,
        };

        mockConcessionRepo.findOne.mockResolvedValue(concession);
        mockConcessionRepo.increment.mockResolvedValue(undefined);
        mockOrderRepo.create.mockReturnValue(order);
        mockOrderRepo.save.mockResolvedValue({ ...order, id: 1 });
        mockOrderItemRepo.create.mockReturnValue({});
        mockOrderItemRepo.save.mockResolvedValue({});

        // Act
        await service.createConcessionOrder(createOrderDto);

        // Assert
        expect(mockConcessionRepo.increment).toHaveBeenCalledWith(
          { id: 1 },
          'stockQuantity',
          -2,
        );
      });

      it('should handle database errors during order creation', async () => {
        // Arrange
        const createOrderDto: CreateConcessionOrderDto = {
          bookingId: 'booking-123',
          userId: 'user-123',
          items: [{ concessionId: 1, quantity: 2 }],
        };

        mockConcessionRepo.findOne.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.createConcessionOrder(createOrderDto),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getConcessionOrdersByUser', () => {
      it('should return orders by user ID', async () => {
        // Arrange
        const userId = 'user-123';
        const expectedOrders = [
          {
            id: 1,
            user: { id: userId },
            orderItems: [],
          },
        ];

        mockOrderRepo.find.mockResolvedValue(expectedOrders);

        // Act
        const result = await service.getConcessionOrdersByUser(userId);

        // Assert
        expect(orderRepo.find).toHaveBeenCalledWith({
          where: { user: { id: userId } },
          relations: ['orderItems', 'orderItems.concession'],
        });
        expect(result).toEqual(expectedOrders);
      });

      it('should return empty array when no orders', async () => {
        // Arrange
        const userId = 'user-123';
        mockOrderRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionOrdersByUser(userId);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        // Arrange
        const userId = 'user-123';
        mockOrderRepo.find.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.getConcessionOrdersByUser(userId),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getConcessionOrdersByBooking', () => {
      it('should return orders by booking ID', async () => {
        // Arrange
        const bookingId = 'booking-123';
        const expectedOrders = [
          {
            id: 1,
            booking: { id: bookingId },
            orderItems: [],
          },
        ];

        mockOrderRepo.find.mockResolvedValue(expectedOrders);

        // Act
        const result = await service.getConcessionOrdersByBooking(bookingId);

        // Assert
        expect(orderRepo.find).toHaveBeenCalledWith({
          where: { booking: { id: bookingId } },
          relations: ['orderItems', 'orderItems.concession'],
        });
        expect(result).toEqual(expectedOrders);
      });

      it('should return empty array when no orders', async () => {
        // Arrange
        const bookingId = 'booking-123';
        mockOrderRepo.find.mockResolvedValue([]);

        // Act
        const result = await service.getConcessionOrdersByBooking(bookingId);

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        // Arrange
        const bookingId = 'booking-123';
        mockOrderRepo.find.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.getConcessionOrdersByBooking(bookingId),
        ).rejects.toThrow('Database error');
      });
    });

    describe('updateOrderStatus', () => {
      it('should update order status successfully', async () => {
        // Arrange
        const orderId = 1;
        const status = ConcessionOrderStatus.PREPARING;

        mockOrderRepo.update.mockResolvedValue(undefined);

        // Act
        await service.updateOrderStatus(orderId, status);

        // Assert
        expect(orderRepo.update).toHaveBeenCalledWith(orderId, { status });
      });

      it('should handle database errors', async () => {
        // Arrange
        const orderId = 1;
        const status = ConcessionOrderStatus.PREPARING;

        mockOrderRepo.update.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.updateOrderStatus(orderId, status),
        ).rejects.toThrow('Database error');
      });
    });

    describe('markOrderAsPaid', () => {
      it('should mark order as paid successfully', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = 'payment-123';

        mockOrderRepo.update.mockResolvedValue(undefined);

        // Act
        await service.markOrderAsPaid(orderId, paymentReference);

        // Assert
        expect(orderRepo.update).toHaveBeenCalledWith(orderId, {
          isPaid: true,
          paymentReference,
          status: ConcessionOrderStatus.CONFIRMED,
        });
      });

      it('should handle empty payment reference', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = '';

        mockOrderRepo.update.mockResolvedValue(undefined);

        // Act
        await service.markOrderAsPaid(orderId, paymentReference);

        // Assert
        expect(orderRepo.update).toHaveBeenCalledWith(orderId, {
          isPaid: true,
          paymentReference: '',
          status: ConcessionOrderStatus.CONFIRMED,
        });
      });

      it('should handle database errors', async () => {
        // Arrange
        const orderId = 1;
        const paymentReference = 'payment-123';

        mockOrderRepo.update.mockRejectedValue(
          new Error('Database error'),
        );

        // Act & Assert
        await expect(
          service.markOrderAsPaid(orderId, paymentReference),
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('Private Methods', () => {
    describe('calculatePreparationTime', () => {
      it('should return default preparation time for single item', () => {
        // Arrange
        const items = [{ concessionId: 1, quantity: 2 }];

        // Act
        const result = (service as any).calculatePreparationTime(items);

        // Assert
        expect(result).toBe(5);
      });

      it('should return max preparation time for multiple items', () => {
        // Arrange
        const items = [
          { concessionId: 1, quantity: 2 },
          { concessionId: 2, quantity: 1 },
        ];

        // Act
        const result = (service as any).calculatePreparationTime(items);

        // Assert
        expect(result).toBe(5);
      });

      it('should handle empty items array', () => {
        // Arrange
        const items: any[] = [];

        // Act
        const result = (service as any).calculatePreparationTime(items);

        // Assert
        expect(result).toBe(0);
      });
    });
  });
});
