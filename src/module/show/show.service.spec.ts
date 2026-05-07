import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowService } from './show.service';
import { Show } from './entity/show.entity';
import { Movie, MovieStatus } from '../movie/entity/movie.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from '../booking/entity/booking.entity';
import { CreateShowDto } from './dto/create-show.dto';
import { User } from '../users/entity/user.entity';
import { Role } from '../role/entity/role.entity';

describe('ShowService', () => {
  let service: ShowService;
  let showRepo: Repository<Show>;
  let movieRepo: Repository<Movie>;
  let screenRepo: Repository<Screen>;
  let seatRepo: Repository<Seat>;
  let bookingRepo: Repository<Booking>;

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

  const mockMovie: Movie = {
    id: 'movie-1',
    name: 'Test Movie',
    description: 'Test Description',
    duration: 120,
    genre: 'Action',
    rating: 8.5,
    language: 'English',
    releaseDate: new Date(),
    poster: [],
    trailer: [],
    isActive: true,
    status: MovieStatus.UPCOMING,
    createdAt: new Date(),
    updatedAt: new Date(),
    shows: [],
    casts: [],
    crews: [],
  };

  const mockScreen: Screen = {
    id: 'screen-1',
    name: 'Screen 1',
    totalSeats: 100,
    isActive: true,
    theaterOwner: mockUser,
  };

  const mockShow: Show = {
    id: 'show-1',
    movie: mockMovie,
    screen: mockScreen,
    showDate: '2024-01-01',
    startTime: '10:00',
    endTime: '12:00',
    pricing: { GOLD: 300, SILVER: 200, STANDARD: 150 },
    isActive: true,
    bookings: [],
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

  const mockShowRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockMovieRepo = {
    findOne: jest.fn(),
  };

  const mockScreenRepo = {
    findOne: jest.fn(),
  };

  const mockSeatRepo = {
    find: jest.fn(),
  };

  const mockBookingRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowService,
        {
          provide: getRepositoryToken(Show),
          useValue: mockShowRepo,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepo,
        },
        {
          provide: getRepositoryToken(Screen),
          useValue: mockScreenRepo,
        },
        {
          provide: getRepositoryToken(Seat),
          useValue: mockSeatRepo,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
      ],
    }).compile();

    service = module.get<ShowService>(ShowService);
    showRepo = module.get<Repository<Show>>(getRepositoryToken(Show));
    movieRepo = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    screenRepo = module.get<Repository<Screen>>(getRepositoryToken(Screen));
    seatRepo = module.get<Repository<Seat>>(getRepositoryToken(Seat));
    bookingRepo = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Success cases', () => {
      it('should create a show successfully with valid data', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300, SILVER: 200 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(movieRepo.findOne).toHaveBeenCalledWith({ where: { id: dto.movieId } });
        expect(screenRepo.findOne).toHaveBeenCalledWith({
          where: { id: dto.screenId },
          relations: ['theaterOwner'],
        });
        expect(showRepo.create).toHaveBeenCalled();
        expect(showRepo.save).toHaveBeenCalled();
      });

      it('should create show with all valid seat types in pricing', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300, SILVER: 200, PLATINUM: 500, STANDARD: 150 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });

      it('should create show with single seat type in pricing', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when movie does not exist', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'nonexistent-movie',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when screen does not exist', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'nonexistent-screen',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException for invalid seat type in pricing', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { INVALID: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty pricing object', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: {},
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });

      it('should handle zero pricing values', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 0 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });

      it('should handle very large pricing values', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 999999 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });

      it('should handle negative pricing values', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: 'movie-1',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: -100 },
        };
        mockMovieRepo.findOne.mockResolvedValue(mockMovie);
        mockScreenRepo.findOne.mockResolvedValue(mockScreen);
        mockShowRepo.create.mockReturnValue(mockShow);
        mockShowRepo.save.mockResolvedValue(mockShow);

        // Act
        const result = await service.create(dto);

        // Assert
        expect(result.data).toEqual(mockShow);
      });

      it('should handle null movieId', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: null as any,
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle undefined movieId', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: undefined as any,
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      });

      it('should handle empty string movieId', async () => {
        // Arrange
        const dto: CreateShowDto = {
          movieId: '',
          screenId: 'screen-1',
          showDate: '2024-01-01',
          startTime: '10:00',
          endTime: '12:00',
          pricing: { GOLD: 300 },
        };
        mockMovieRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('findAll', () => {
    describe('Success cases', () => {
      it('should return all shows with relations', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([mockShow]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual([mockShow]);
        expect(showRepo.createQueryBuilder).toHaveBeenCalledWith('show');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.movie', 'movie');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.screen', 'screen');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });

      it('should return empty array when no shows exist', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockResolvedValue([]);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result.data).toEqual([]);
        expect(showRepo.createQueryBuilder).toHaveBeenCalledWith('show');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.movie', 'movie');
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('show.screen', 'screen');
        expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle repository errors gracefully', async () => {
        // Arrange
        mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

        // Act & Assert
        await expect(service.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findOne', () => {
    describe('Success cases', () => {
      it('should return a show by id with relations', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);

        // Act
        const result = await service.findOne('show-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('data');
        expect(result.data).toEqual(mockShow);
        expect(showRepo.findOne).toHaveBeenCalledWith({
          where: { id: 'show-1' },
          relations: ['movie', 'screen'],
        });
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when show does not exist', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(null as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle undefined id', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne(undefined as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle invalid uuid format', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('delete', () => {
    describe('Success cases', () => {
      it('should delete a show successfully', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);
        mockShowRepo.remove.mockResolvedValue(mockShow);

        // Act
        const result = await service.delete('show-1');

        // Assert
        expect(result).toHaveProperty('message');
        expect(showRepo.findOne).toHaveBeenCalledWith({ where: { id: 'show-1' } });
        expect(showRepo.remove).toHaveBeenCalledWith(mockShow);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when show does not exist', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string id', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null id', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.delete(null as any)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('getSeatAvailability', () => {
    describe('Success cases', () => {
      it('should return seat availability for a show', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);
        mockSeatRepo.find.mockResolvedValue([mockSeat]);
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };
        mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        // Act
        const result = await service.getSeatAvailability('show-1');

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('seatNumber');
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('price');
        expect(result[0]).toHaveProperty('isBooked');
      });

      it('should mark booked seats correctly', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);
        mockSeatRepo.find.mockResolvedValue([mockSeat]);
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([{ seat_id: 'seat-1' }]),
        };
        mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        // Act
        const result = await service.getSeatAvailability('show-1');

        // Assert
        expect(result[0].isBooked).toBe(true);
      });

      it('should mark available seats correctly', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);
        mockSeatRepo.find.mockResolvedValue([mockSeat]);
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };
        mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        // Act
        const result = await service.getSeatAvailability('show-1');

        // Assert
        expect(result[0].isBooked).toBe(false);
      });
    });

    describe('Failure cases', () => {
      it('should throw NotFoundException when show does not exist', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.getSeatAvailability('nonexistent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('Edge cases', () => {
      it('should handle show with no seats', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(mockShow);
        mockSeatRepo.find.mockResolvedValue([]);
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };
        mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        // Act
        const result = await service.getSeatAvailability('show-1');

        // Assert
        expect(result).toEqual([]);
      });

      it('should handle empty string showId', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.getSeatAvailability('')).rejects.toThrow(NotFoundException);
      });

      it('should handle null showId', async () => {
        // Arrange
        mockShowRepo.findOne.mockResolvedValue(null);

        // Act & Assert
        await expect(service.getSeatAvailability(null as any)).rejects.toThrow(NotFoundException);
      });

      it('should handle seat with no pricing defined', async () => {
        // Arrange
        const showWithoutPricing = { ...mockShow, pricing: {} };
        mockShowRepo.findOne.mockResolvedValue(showWithoutPricing);
        mockSeatRepo.find.mockResolvedValue([mockSeat]);
        const mockQueryBuilder = {
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };
        mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

        // Act
        const result = await service.getSeatAvailability('show-1');

        // Assert
        expect(result[0].price).toBe(0);
      });
    });
  });
});

