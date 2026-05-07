import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScreenService } from './screen.service';
import { Screen } from './entity/screen.entity';
import { User } from '../users/entity/user.entity';
import { Seat } from '../seat/entity/seat.entity';
import { CreateScreenDTO } from './dto/create-screen-dto';
import { UpdateScreenDTO } from './dto/update-screen.dto';
import { Role } from '../role/entity/role.entity';

describe('ScreenService', () => {
  let service: ScreenService;
  let screenRepo: Repository<Screen>;
  let userRepo: Repository<User>;
  let seatRepo: Repository<Seat>;

  const mockRole: Role = {
    id: 1,
    name: 'THEATER_OWNER',
    permissions: [],
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'owner@example.com',
    password: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
    mobileNumber: '1234567890',
    isVerified: true,
    role: mockRole,
    gender: null as any,
    dateOfBirth: null as any,
    profile: null as any,
    theatreName: null as any,
    businessType: null as any,
    gstNumber: null as any,
    panNumber: null as any,
    address: null as any,
    city: null as any,
    state: null as any,
    pincode: null as any,
    bankName: null as any,
    accountNumber: null as any,
    ifscCode: null as any,
    accountHolderName: null as any,
    idProof: null as any,
    agreementDoc: null as any,
    adminVerified: false,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };

  const mockScreen: Screen = {
    id: 'screen-1',
    name: 'Screen 1',
    totalSeats: 100,
    isActive: true,
    theaterOwner: mockUser,
  };

  const mockSeat: Seat = {
    id: 'seat-1',
    seatNumber: 'A1',
    row: 'A',
    seatType: 'GOLD' as any,
    price: 300,
    screen: mockScreen,
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockScreenRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockSeatRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreenService,
        {
          provide: getRepositoryToken(Screen),
          useValue: mockScreenRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: mockSeatRepo,
        },
      ],
    }).compile();

    service = module.get<ScreenService>(ScreenService);
    screenRepo = module.get<Repository<Screen>>(getRepositoryToken(Screen));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    seatRepo = module.get<Repository<Seat>>(getRepositoryToken(Seat));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createScreen', () => {
    describe('Success cases', () => {
      it('should create a screen successfully with valid data', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [
            { row: 'A', seats: 10, type: 'GOLD' },
            { row: 'B', seats: 12, type: 'SILVER' },
          ],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: dto.ownerId } });
        expect(screenRepo.create).toHaveBeenCalled();
        expect(screenRepo.save).toHaveBeenCalled();
        expect(seatRepo.save).toHaveBeenCalled();
      });

      it('should create screen with single row layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(result.data).toEqual(mockScreen);
      });

      it('should calculate total seats correctly', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [
            { row: 'A', seats: 10, type: 'GOLD' },
            { row: 'B', seats: 12, type: 'SILVER' },
            { row: 'C', seats: 15, type: 'STANDARD' },
          ],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(screenRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ totalSeats: 37 }),
        );
      });

      it('should create seats for all rows in layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [
            { row: 'A', seats: 2, type: 'GOLD' },
            { row: 'B', seats: 2, type: 'SILVER' },
          ],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        await service.createScreen(dto);

        // Assert
        expect(seatRepo.create).toHaveBeenCalledTimes(4);
        expect(seatRepo.save).toHaveBeenCalledTimes(1);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when owner does not exist', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'nonexistent-user',
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(screenRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ totalSeats: 0 }),
        );
      });

      it('should handle layout with zero seats', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: 0, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(screenRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ totalSeats: 0 }),
        );
      });

      it('should handle very large number of seats', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: 1000, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(seatRepo.create).toHaveBeenCalledTimes(1000);
      });

      it('should handle null ownerId', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: null as any,
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle undefined ownerId', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: undefined as any,
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle empty string ownerId', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: '',
          layout: [{ row: 'A', seats: 10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle null layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: null as any,
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow();
      });

      it('should handle undefined layout', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: undefined as any,
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act & Assert
        await expect(service.createScreen(dto)).rejects.toThrow();
      });

      it('should handle negative seat count', async () => {
        // Arrange
        const dto: CreateScreenDTO = {
          name: 'Screen 1',
          ownerId: 'user-1',
          layout: [{ row: 'A', seats: -10, type: 'GOLD' }],
        };
        mockUserRepo.findOne.mockResolvedValue(mockUser);
        mockScreenRepo.create.mockReturnValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);
        mockSeatRepo.create.mockReturnValue(mockSeat);
        mockSeatRepo.save.mockResolvedValue(mockSeat);

        // Act
        const result = await service.createScreen(dto);

        // Assert
        expect(screenRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ totalSeats: -10 }),
        );
      });
    });
  });

  describe('findAllScreen', () => {
    describe('Success cases', () => {
      it('should return all screens with relations', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([mockScreen]);

        // Act
        const result = await service.findAllScreen();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockScreen]);
        expect(screenRepo.createQueryBuilder).toHaveBeenCalledWith('screen');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('screen.theaterOwner', 'theaterOwner');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });

      it('should return empty array when no screens exist', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.findAllScreen();

        // Assert
        expect(result.data).toEqual([]);
        expect(screenRepo.createQueryBuilder).toHaveBeenCalledWith('screen');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('screen.theaterOwner', 'theaterOwner');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAllScreen()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a screen by id with relations', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);

        // Act
        const result = await service.findOne('screen-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockScreen);
        expect(screenRepo.findOne).toHaveBeenCalledWith({
          where: { id: 'screen-1' },
          relations: ['theaterOwner'],
        });
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when screen does not exist', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(null as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(undefined as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle invalid uuid format', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('updateScreen', () => {
    describe('Success cases', () => {
      it('should update a screen successfully', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.updateScreen('screen-1', dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(screenRepo.findOne).toHaveBeenCalledWith({ where: { id: 'screen-1' } });
        expect(screenRepo.save).toHaveBeenCalledWith(mockScreen);
      });

      it('should update screen with partial data', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.updateScreen('screen-1', dto);

        // Assert
        expect(mockScreen.name).toBe('Updated Screen');
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when screen does not exist', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateScreen('nonexistent', dto)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty dto', async () => {
        // Arrange
        const dto: UpdateScreenDTO = {};
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.updateScreen('screen-1', dto);

        // Assert
        expect(screenRepo.save).toHaveBeenCalledWith(mockScreen);
      });

      it('should handle null dto', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.updateScreen('screen-1', null as any);

        // Assert
        expect(screenRepo.save).toHaveBeenCalledWith(mockScreen);
      });

      it('should handle undefined dto', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.save.mockResolvedValue(mockScreen);

        // Act
        const result = await service.updateScreen('screen-1', undefined as any);

        // Assert
        expect(screenRepo.save).toHaveBeenCalledWith(mockScreen);
      });

      it('should handle empty string id', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateScreen('', dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        const dto: UpdateScreenDTO = { name: 'Updated Screen' };
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.updateScreen(null as any, dto)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('deleteScreen', () => {
    describe('Success cases', () => {
      it('should delete a screen successfully', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockScreenRepo.remove.mockResolvedValue(mockScreen);

        // Act
        const result = await service.deleteScreen('screen-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(screenRepo.findOne).toHaveBeenCalledWith({ where: { id: 'screen-1' } });
        expect(screenRepo.remove).toHaveBeenCalledWith(mockScreen);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when screen does not exist', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteScreen('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteScreen('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteScreen(null as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.deleteScreen(undefined as any)).rejects.toThrow(NotFoundException);
      });
    });
  });
});

