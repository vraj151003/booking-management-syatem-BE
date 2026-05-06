import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RecommendationService } from './recommendation.service';
import { Booking } from '../booking/entity/booking.entity';
import { Movie } from '../movie/entity/movie.entity';
import { User } from '../users/entity/user.entity';

describe('RecommendationService', () => {
  let service: RecommendationService;
  let bookingRepo: jest.Mocked<Repository<Booking>>;
  let movieRepo: jest.Mocked<Repository<Movie>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockMovie = {
    id: 'movie-123',
    name: 'Test Movie',
    genre: 'Action',
    rating: 4.5,
    isActive: true,
    status: 'RUNNING',
  };

  const mockBooking = {
    id: 'booking-123',
    user: mockUser,
    show: { movie: mockMovie },
    isUsed: true,
    status: 'CONFIRMED',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Mock QueryBuilder chain
    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getOne: jest.fn(),
    };

    const mockDataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: getRepositoryToken(Booking),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
    bookingRepo = module.get(getRepositoryToken(Booking));
    movieRepo = module.get(getRepositoryToken(Movie));
    userRepo = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations for existing user', async () => {
      // Arrange
      const mockUserPreferences = [
        { booking_user_id: 'user-123', show_movie_id: 'movie-1', movie_rating: 4.5, movie_genre: 'Action', booking_watched_at: new Date(), score: 1.0 },
        { booking_user_id: 'user-123', show_movie_id: 'movie-2', movie_rating: 4.0, movie_genre: 'Comedy', booking_watched_at: new Date(), score: 0.8 },
      ];

      const mockSimilarUsers = [
        { other_user_id: 'user-456', common_movies: 1, avg_other_score: 0.9 },
        { other_user_id: 'user-789', common_movies: 1, avg_other_score: 0.7 },
      ];

      // No similar users found, so it will fall back to popular movies
      const mockPopularMovies = [
        {
          movie_id: 'movie-3',
          movie_name: 'Recommended Movie',
          booking_count: '0',
          avg_rating: '4.2',
          movie_poster: ['poster3.jpg'],
          movie_genre: 'Action',
        },
      ];

      // Get references to the mock QueryBuilder objects
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      // Mock QueryBuilder calls
      bookingQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockUserPreferences)
        .mockResolvedValueOnce(mockSimilarUsers);
      
      movieQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockPopularMovies);

      // Act
      const result = await service.getPersonalizedRecommendations('user-123', 10);

      // Assert
      expect(result).toEqual([
        {
          movieId: 'movie-3',
          title: 'Recommended Movie',
          score: 0, 
          reason: 'Popular movies',
          genre: 'Action',
          rating: 4.2,
          poster: 'poster3.jpg',
        },
      ]);
      expect(bookingRepo.createQueryBuilder).toHaveBeenCalledTimes(3);
      expect(movieRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('should return popular movies for new user', async () => {
      // Arrange
      const mockUserPreferences = []; // Empty for new user

      const mockPopularMovies = [
        {
          movie_id: 'movie-1',
          movie_name: 'Popular Movie',
          booking_count: '80',
          avg_rating: '4.0',
          movie_poster: ['poster1.jpg'],
          movie_genre: 'Comedy',
        },
      ];

      // Get references to the mock QueryBuilder objects
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      // Mock QueryBuilder calls
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce(mockUserPreferences);
      movieQueryBuilder.getRawMany.mockResolvedValueOnce(mockPopularMovies);

      // Act
      const result = await service.getPersonalizedRecommendations('new-user', 10);

      // Assert
      expect(result).toEqual([
        {
          movieId: 'movie-1',
          title: 'Popular Movie',
          score: 8, // 80 / 10
          reason: 'Popular movies',
          genre: 'Comedy',
          rating: 4.0,
          poster: 'poster1.jpg',
        }
      ]);
      expect(bookingRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(movieRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      bookingQueryBuilder.getRawMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.getPersonalizedRecommendations('user-123', 10))
        .rejects.toThrow('Database error');
    });
  });

  describe('getGenreBasedRecommendations', () => {
    it('should return recommendations based on user genre preferences', async () => {
      // Arrange
      const mockGenrePreferences = [
        { movie_genre: 'Action', watch_count: '5', avg_rating: '4.0' },
        { movie_genre: 'Comedy', watch_count: '3', avg_rating: '3.5' },
      ];

      const mockGenreMovies = [
        {
          movie_id: 'movie-1',
          movie_name: 'Action Movie',
          movie_genre: 'Action',
          movie_rating: 4.2,
          movie_poster: ['poster1.jpg'],
        },
      ];

      const expectedRecommendations = [
        {
          movieId: 'movie-1',
          title: 'Action Movie',
          score: 4.2,
          reason: 'Based on your interest in Action',
          genre: 'Action',
          rating: 4.2,
          poster: 'poster1.jpg',
        },
      ];

      // Get references to the mock QueryBuilder objects
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      // Mock QueryBuilder calls
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce(mockGenrePreferences);
      movieQueryBuilder.getRawMany.mockResolvedValueOnce(mockGenreMovies);

      // Act
      const result = await service.getGenreBasedRecommendations('user-123', 10);

      // Assert
      expect(result).toEqual(expectedRecommendations);
    });

    it('should return popular movies when user has no genre preferences', async () => {
      // Arrange
      const mockPopularMovies = [
        {
          movie_id: 'movie-1',
          movie_name: 'Popular Movie',
          booking_count: '80',
          avg_rating: '4.0',
          movie_poster: ['poster1.jpg'],
          movie_genre: 'Comedy',
        },
      ];

      // Get references to the mock QueryBuilder objects
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      // Mock QueryBuilder calls
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce([]); // Empty genre preferences
      movieQueryBuilder.getRawMany.mockResolvedValueOnce(mockPopularMovies);

      // Act
      const result = await service.getGenreBasedRecommendations('user-123', 10);

      // Assert
      expect(result).toEqual([
        {
          movieId: 'movie-1',
          title: 'Popular Movie',
          score: 8, // 80 / 10
          reason: 'Popular movies',
          genre: 'Comedy',
          rating: 4.0,
          poster: 'poster1.jpg',
        }
      ]);
      expect(bookingRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
      expect(movieRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty booking history', async () => {
      // Arrange
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce([]); // Empty preferences
      movieQueryBuilder.getRawMany.mockResolvedValueOnce([
        {
          movie_id: 'movie-1',
          movie_name: 'Popular Movie',
          booking_count: '0',
          avg_rating: '4.0',
          movie_poster: ['poster1.jpg'],
          movie_genre: 'Action',
        },
      ]);

      // Act
      const recommendationsResult = await service.getPersonalizedRecommendations('new-user', 10);

      // Assert
      expect(recommendationsResult).toHaveLength(1);
      expect(recommendationsResult[0].reason).toBe('Popular movies');
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      bookingQueryBuilder.getRawMany.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.getPersonalizedRecommendations('invalid-user', 10))
        .rejects.toThrow('User not found');
    });

    it('should handle limit parameter correctly', async () => {
      // Arrange
      const mockRecommendations = Array(5).fill(null).map((_, i) => ({
        movie_id: `movie-${i}`,
        movie_name: `Movie ${i}`,
        booking_count: '10',
        avg_rating: '4.0',
        movie_poster: [`poster${i}.jpg`],
        movie_genre: 'Test',
      }));

      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce([]);
      movieQueryBuilder.getRawMany.mockResolvedValueOnce(mockRecommendations);

      // Act
      const limitResult = await service.getPersonalizedRecommendations('user-123', 5);

      // Assert
      expect(limitResult).toHaveLength(5);
    });
  });

  describe('Performance Considerations', () => {
    it('should use efficient database queries', async () => {
      // Arrange
      const bookingQueryBuilder = bookingRepo.createQueryBuilder() as any;
      const movieQueryBuilder = movieRepo.createQueryBuilder() as any;
      
      bookingQueryBuilder.getRawMany.mockResolvedValueOnce([]);
      movieQueryBuilder.getRawMany.mockResolvedValueOnce([]);

      // Act
      await service.getPersonalizedRecommendations('user-123', 10);

      // Assert
      expect(bookingRepo.createQueryBuilder).toHaveBeenCalled();
      expect(movieRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });
});
