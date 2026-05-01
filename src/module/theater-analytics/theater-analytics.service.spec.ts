import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TheaterAnalyticsService } from './theater-analytics.service';
import { Booking } from '../booking/entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Movie } from '../movie/entity/movie.entity';
import { Repository } from 'typeorm';

describe('TheaterAnalyticsService', () => {
  let service: TheaterAnalyticsService;
  let bookingRepo: Repository<Booking>;
  let showRepo: Repository<Show>;
  let screenRepo: Repository<Screen>;
  let movieRepo: Repository<Movie>;

  const mockBookingRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockShowRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockScreenRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockMovieRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TheaterAnalyticsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: getRepositoryToken(Show),
          useValue: mockShowRepo,
        },
        {
          provide: getRepositoryToken(Screen),
          useValue: mockScreenRepo,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepo,
        },
      ],
    }).compile();

    service = module.get<TheaterAnalyticsService>(TheaterAnalyticsService);
    bookingRepo = module.get<Repository<Booking>>(getRepositoryToken(Booking));
    showRepo = module.get<Repository<Show>>(getRepositoryToken(Show));
    screenRepo = module.get<Repository<Screen>>(getRepositoryToken(Screen));
    movieRepo = module.get<Repository<Movie>>(getRepositoryToken(Movie));

    mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockShowRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockScreenRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockMovieRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        revenue: '5000',
        totalBookings: '10',
      };
      mockQueryBuilder.getRawOne.mockResolvedValue(mockResult);

      const result = await service.getDailyRevenue('user-123', '2026-05-01');

      expect(result).toEqual({
        date: '2026-05-01',
        revenue: '5000',
        totalBookings: 10,
      });
    });

    it('should return zero revenue when no bookings exist', async () => {
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      const result = await service.getDailyRevenue('user-123', '2026-05-01');

      expect(result).toEqual({
        date: '2026-05-01',
        revenue: 0,
        totalBookings: 0,
      });
    });

    it('should use today\'s date when no date is provided', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockQueryBuilder.getRawOne.mockResolvedValue(null);

      await service.getDailyRevenue('user-123');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('DATE(booking.createdAt) = :date', { date: today });
    });
  });

  describe('getOccupancyRate', () => {
    it('should return occupancy rate for a given date', async () => {
      const mockShows = [
        {
          show_id: 'show-1',
          show_showDate: '2026-05-01',
          show_startTime: '10:00',
          screen_totalSeats: '100',
          bookedSeats: '80',
        },
        {
          show_id: 'show-2',
          show_showDate: '2026-05-01',
          show_startTime: '14:00',
          screen_totalSeats: '100',
          bookedSeats: '60',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockShows);

      const result = await service.getOccupancyRate('user-123', '2026-05-01');

      expect(result.totalSeats).toBe(200);
      expect(result.totalBookedSeats).toBe(140);
      expect(result.occupancyRate).toBe(70);
      expect(result.showDetails).toHaveLength(2);
    });

    it('should return zero occupancy when no shows exist', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getOccupancyRate('user-123', '2026-05-01');

      expect(result.totalSeats).toBe(0);
      expect(result.totalBookedSeats).toBe(0);
      expect(result.occupancyRate).toBe(0);
    });
  });

  describe('getTopMovies', () => {
    it('should return top movies for a given date', async () => {
      const mockMovies = [
        {
          movie_id: 'movie-1',
          movie_title: 'Movie A',
          movie_genre: 'Action',
          totalBookings: '50',
          totalRevenue: '5000',
        },
        {
          movie_id: 'movie-2',
          movie_title: 'Movie B',
          movie_genre: 'Comedy',
          totalBookings: '30',
          totalRevenue: '3000',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockMovies);

      const result = await service.getTopMovies('user-123', 10, '2026-05-01');

      expect(result.topMovies).toHaveLength(2);
      expect(result.topMovies[0].title).toBe('Movie A');
      expect(result.topMovies[0].totalBookings).toBe(50);
    });

    it('should use default limit of 10 when not provided', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.getTopMovies('user-123', undefined, '2026-05-01');

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getTopShows', () => {
    it('should return top shows for a given date', async () => {
      const mockShows = [
        {
          show_id: 'show-1',
          show_showDate: '2026-05-01',
          show_startTime: '10:00',
          movieTitle: 'Movie A',
          screenName: 'Screen 1',
          totalBookings: '50',
          totalRevenue: '5000',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(mockShows);

      const result = await service.getTopShows('user-123', 10, '2026-05-01');

      expect(result.topShows).toHaveLength(1);
      expect(result.topShows[0].movieTitle).toBe('Movie A');
      expect(result.topShows[0].screenName).toBe('Screen 1');
    });
  });

  describe('getCancellationRate', () => {
    it('should return cancellation rate for a given date', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(100) // total bookings
        .mockResolvedValueOnce(10); // cancelled bookings

      const result = await service.getCancellationRate('user-123', '2026-05-01');

      expect(result.totalBookings).toBe(100);
      expect(result.cancelledBookings).toBe(10);
      expect(result.cancellationRate).toBe(10);
    });

    it('should return zero cancellation rate when no bookings exist', async () => {
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getCancellationRate('user-123', '2026-05-01');

      expect(result.cancellationRate).toBe(0);
    });
  });

  describe('getOverallAnalytics', () => {
    it('should return overall analytics for a given date', async () => {
      const mockDailyRevenue = { date: '2026-05-01', revenue: 5000, totalBookings: 10 };
      const mockOccupancyRate = { date: '2026-05-01', totalSeats: 200, totalBookedSeats: 140, occupancyRate: 70 };
      const mockTopMovies = { date: '2026-05-01', topMovies: [] };
      const mockTopShows = { date: '2026-05-01', topShows: [] };
      const mockCancellationRate = { date: '2026-05-01', totalBookings: 100, cancelledBookings: 10, cancellationRate: 10 };

      jest.spyOn(service, 'getDailyRevenue').mockResolvedValue(mockDailyRevenue);
      jest.spyOn(service, 'getOccupancyRate').mockResolvedValue(mockOccupancyRate);
      jest.spyOn(service, 'getTopMovies').mockResolvedValue(mockTopMovies);
      jest.spyOn(service, 'getTopShows').mockResolvedValue(mockTopShows);
      jest.spyOn(service, 'getCancellationRate').mockResolvedValue(mockCancellationRate);

      const result = await service.getOverallAnalytics('user-123', '2026-05-01');

      expect(result).toHaveProperty('dailyRevenue');
      expect(result).toHaveProperty('occupancyRate');
      expect(result).toHaveProperty('topMovies');
      expect(result).toHaveProperty('topShows');
      expect(result).toHaveProperty('cancellationRate');
    });
  });
});
