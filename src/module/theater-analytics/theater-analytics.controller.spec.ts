import { Test, TestingModule } from '@nestjs/testing';
import { TheaterAnalyticsController } from './theater-analytics.controller';
import { TheaterAnalyticsService } from './theater-analytics.service';

describe('TheaterAnalyticsController', () => {
  let controller: TheaterAnalyticsController;
  let service: TheaterAnalyticsService;

  const mockTheaterAnalyticsService = {
    getDailyRevenue: jest.fn(),
    getOccupancyRate: jest.fn(),
    getTopMovies: jest.fn(),
    getTopShows: jest.fn(),
    getCancellationRate: jest.fn(),
    getOverallAnalytics: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'theater@example.com',
    role: 'THEATER_OWNER',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TheaterAnalyticsController],
      providers: [
        {
          provide: TheaterAnalyticsService,
          useValue: mockTheaterAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<TheaterAnalyticsController>(TheaterAnalyticsController);
    service = module.get<TheaterAnalyticsService>(TheaterAnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyRevenue', () => {
    it('should return daily revenue for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        revenue: 5000,
        totalBookings: 10,
      };
      mockTheaterAnalyticsService.getDailyRevenue.mockResolvedValue(mockResult);

      const result = await controller.getDailyRevenue(mockRequest, '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getDailyRevenue).toHaveBeenCalledWith('user-123', '2026-05-01');
    });

    it('should use today\'s date when no date is provided', async () => {
      const mockResult = {
        date: new Date().toISOString().split('T')[0],
        revenue: 5000,
        totalBookings: 10,
      };
      mockTheaterAnalyticsService.getDailyRevenue.mockResolvedValue(mockResult);

      const result = await controller.getDailyRevenue(mockRequest);

      expect(result).toEqual(mockResult);
      expect(service.getDailyRevenue).toHaveBeenCalledWith('user-123', undefined);
    });
  });

  describe('getOccupancyRate', () => {
    it('should return occupancy rate for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        totalSeats: 200,
        totalBookedSeats: 140,
        occupancyRate: 70,
        showDetails: [],
      };
      mockTheaterAnalyticsService.getOccupancyRate.mockResolvedValue(mockResult);

      const result = await controller.getOccupancyRate(mockRequest, '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getOccupancyRate).toHaveBeenCalledWith('user-123', '2026-05-01');
    });
  });

  describe('getTopMovies', () => {
    it('should return top movies for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        topMovies: [
          {
            movieId: 'movie-1',
            title: 'Movie A',
            genre: 'Action',
            totalBookings: 50,
            totalRevenue: 5000,
          },
        ],
      };
      mockTheaterAnalyticsService.getTopMovies.mockResolvedValue(mockResult);

      const result = await controller.getTopMovies(mockRequest, '10', '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getTopMovies).toHaveBeenCalledWith('user-123', 10, '2026-05-01');
    });

    it('should use default limit when not provided', async () => {
      const mockResult = {
        date: '2026-05-01',
        topMovies: [],
      };
      mockTheaterAnalyticsService.getTopMovies.mockResolvedValue(mockResult);

      const result = await controller.getTopMovies(mockRequest, undefined, '2026-05-01');

      expect(service.getTopMovies).toHaveBeenCalledWith('user-123', 10, '2026-05-01');
    });
  });

  describe('getTopShows', () => {
    it('should return top shows for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        topShows: [
          {
            showId: 'show-1',
            showDate: '2026-05-01',
            startTime: '10:00',
            movieTitle: 'Movie A',
            screenName: 'Screen 1',
            totalBookings: 50,
            totalRevenue: 5000,
          },
        ],
      };
      mockTheaterAnalyticsService.getTopShows.mockResolvedValue(mockResult);

      const result = await controller.getTopShows(mockRequest, '10', '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getTopShows).toHaveBeenCalledWith('user-123', 10, '2026-05-01');
    });
  });

  describe('getCancellationRate', () => {
    it('should return cancellation rate for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        totalBookings: 100,
        cancelledBookings: 10,
        cancellationRate: 10,
      };
      mockTheaterAnalyticsService.getCancellationRate.mockResolvedValue(mockResult);

      const result = await controller.getCancellationRate(mockRequest, '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getCancellationRate).toHaveBeenCalledWith('user-123', '2026-05-01');
    });
  });

  describe('getOverallAnalytics', () => {
    it('should return overall analytics for a given date', async () => {
      const mockResult = {
        date: '2026-05-01',
        dailyRevenue: { date: '2026-05-01', revenue: 5000, totalBookings: 10 },
        occupancyRate: { date: '2026-05-01', totalSeats: 200, totalBookedSeats: 140, occupancyRate: 70 },
        topMovies: { date: '2026-05-01', topMovies: [] },
        topShows: { date: '2026-05-01', topShows: [] },
        cancellationRate: { date: '2026-05-01', totalBookings: 100, cancelledBookings: 10, cancellationRate: 10 },
      };
      mockTheaterAnalyticsService.getOverallAnalytics.mockResolvedValue(mockResult);

      const result = await controller.getOverallAnalytics(mockRequest, '2026-05-01');

      expect(result).toEqual(mockResult);
      expect(service.getOverallAnalytics).toHaveBeenCalledWith('user-123', '2026-05-01');
    });
  });
});
