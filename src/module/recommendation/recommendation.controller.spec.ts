import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { 
  GetRecommendationsDto, 
  RecommendationResponseDto, 
  RecommendationStatsDto,
  RecommendationType 
} from './dto/recommendation.dto';

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let service: jest.Mocked<RecommendationService>;

  const mockRecommendations: RecommendationResponseDto[] = [
    {
      movieId: 'movie-1',
      title: 'Test Movie 1',
      score: 0.9,
      reason: 'Recommended based on similar users\' preferences',
      genre: 'Action',
      rating: 4.5,
      poster: 'poster1.jpg',
    },
    {
      movieId: 'movie-2',
      title: 'Test Movie 2',
      score: 0.8,
      reason: 'Trending in the last 30 days',
      genre: 'Comedy',
      rating: 4.2,
    },
  ];

  beforeEach(async () => {
    const mockRecommendationService = {
      getPersonalizedRecommendations: jest.fn(),
      getGenreBasedRecommendations: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        {
          provide: RecommendationService,
          useValue: mockRecommendationService,
        },
      ],
    }).compile();

    controller = module.get<RecommendationController>(RecommendationController);
    service = module.get(RecommendationService) as jest.Mocked<RecommendationService>;
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations with default limit', async () => {
      // Arrange
      service.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getPersonalizedRecommendations('user-123');

      // Assert
      expect(service.getPersonalizedRecommendations).toHaveBeenCalledWith('user-123', 10);
      expect(result.recommendations).toEqual(mockRecommendations);
      expect(result.stats).toEqual({
        totalRecommendations: 2,
        type: RecommendationType.PERSONALIZED,
        userId: 'user-123',
        generatedAt: expect.any(Date),
      });
    });

    it('should return personalized recommendations with custom limit', async () => {
      // Arrange
      service.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getPersonalizedRecommendations('user-123', '15');

      // Assert
      expect(service.getPersonalizedRecommendations).toHaveBeenCalledWith('user-123', 15);
      expect(result.recommendations).toEqual(mockRecommendations);
    });
  });

  describe('getGenreBasedRecommendations', () => {
    it('should return genre-based recommendations with default limit', async () => {
      // Arrange
      service.getGenreBasedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getGenreBasedRecommendations('user-123');

      // Assert
      expect(service.getGenreBasedRecommendations).toHaveBeenCalledWith('user-123', 10);
      expect(result.recommendations).toEqual(mockRecommendations);
      expect(result.stats).toEqual({
        totalRecommendations: 2,
        type: RecommendationType.GENRE_BASED,
        userId: 'user-123',
        generatedAt: expect.any(Date),
      });
    });

    it('should return genre-based recommendations with custom limit', async () => {
      // Arrange
      service.getGenreBasedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getGenreBasedRecommendations('user-123', '8');

      // Assert
      expect(service.getGenreBasedRecommendations).toHaveBeenCalledWith('user-123', 8);
      expect(result.recommendations).toEqual(mockRecommendations);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Arrange
      service.getPersonalizedRecommendations.mockRejectedValue(new Error('Service error'));

      // Act & Assert
      await expect(controller.getPersonalizedRecommendations('user-123'))
        .rejects.toThrow('Service error');
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format', async () => {
      // Arrange
      service.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getPersonalizedRecommendations('user-123');

      // Assert
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('stats');
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.stats).toHaveProperty('totalRecommendations');
      expect(result.stats).toHaveProperty('type');
      expect(result.stats).toHaveProperty('generatedAt');
    });

    it('should include all required fields in recommendation response', async () => {
      // Arrange
      service.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      // Act
      const result = await controller.getPersonalizedRecommendations('user-123');

      // Assert
      const recommendation = result.recommendations[0];
      expect(recommendation).toHaveProperty('movieId');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('score');
      expect(recommendation).toHaveProperty('reason');
      expect(recommendation).toHaveProperty('genre');
      expect(recommendation).toHaveProperty('rating');
    });
  });
});
