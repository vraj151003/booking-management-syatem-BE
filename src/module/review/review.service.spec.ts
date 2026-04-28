import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewService } from './review.service';
import { Review, ReviewableType } from './entity/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Booking } from '../booking/entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Screen } from '../screen/entity/screen.entity';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: jest.Mocked<Repository<Review>>;
  let bookingRepo: jest.Mocked<Repository<Booking>>;
  let showRepo: jest.Mocked<Repository<Show>>;
  let screenRepo: jest.Mocked<Repository<Screen>>;

  const createMockReview = (): Review => ({
    id: 'review-123',
    userId: 'user-123',
    reviewableType: ReviewableType.MOVIE,
    reviewableId: 'movie-123',
    rating: 4.5,
    comment: 'Great movie!',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockReviewRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBookingRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockShowRepo = {
    createQueryBuilder: jest.fn(),
  };

  const mockScreenRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepo,
        },
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
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepo = module.get(getRepositoryToken(Review));
    bookingRepo = module.get(getRepositoryToken(Booking));
    showRepo = module.get(getRepositoryToken(Show));
    screenRepo = module.get(getRepositoryToken(Screen));
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    const dto: CreateReviewDto = {
      reviewableType: ReviewableType.MOVIE,
      reviewableId: 'movie-123',
      rating: 4.5,
      comment: 'Great movie!',
    };

    it('should create review successfully with valid booking', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(null);
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'booking-123' }]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      
      mockReviewRepo.create.mockReturnValue(createMockReview());
      mockReviewRepo.save.mockResolvedValue(createMockReview());

      // Act
      const result = await service.createReview('user-123', dto);

      // Assert
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          reviewableType: ReviewableType.MOVIE,
          reviewableId: 'movie-123',
        },
      });
      expect(mockReviewRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reviewableType: ReviewableType.MOVIE,
        reviewableId: 'movie-123',
        rating: 4.5,
        comment: 'Great movie!',
      });
      expect(mockReviewRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        userId: 'user-123',
        reviewableType: ReviewableType.MOVIE,
        rating: 4.5,
        comment: 'Great movie!',
      });
    });

    it('should throw error if review already exists', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(createMockReview());

      // Act & Assert
      await expect(service.createReview('user-123', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createReview('user-123', dto)).rejects.toThrow(
        'You have already reviewed this item',
      );
    });

    it('should throw ForbiddenException if user has no booking for movie', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(null);
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      // Act & Assert
      await expect(service.createReview('user-123', dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.createReview('user-123', dto)).rejects.toThrow(
        'You can only review movies and theaters you have booked',
      );
    });

    it('should create theater review with valid booking', async () => {
      // Arrange
      const theaterDto: CreateReviewDto = {
        reviewableType: ReviewableType.THEATER,
        reviewableId: 'theater-123',
        rating: 5,
        comment: 'Great theater!',
      };
      mockReviewRepo.findOne.mockResolvedValue(null);
      
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 'booking-123' }]),
      };
      mockBookingRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      
      mockReviewRepo.create.mockReturnValue(createMockReview());
      mockReviewRepo.save.mockResolvedValue(createMockReview());

      // Act
      await service.createReview('user-123', theaterDto);

      // Assert
      expect(mockReviewRepo.create).toHaveBeenCalledWith({
        userId: 'user-123',
        reviewableType: ReviewableType.THEATER,
        reviewableId: 'theater-123',
        rating: 5,
        comment: 'Great theater!',
      });
    });
  });

  describe('findAllReviews', () => {
    it('should return all reviews ordered by createdAt DESC', async () => {
      // Arrange
      const reviews = [createMockReview(), { ...createMockReview(), id: 'review-456' }];
      mockReviewRepo.find.mockResolvedValue(reviews);

      // Act
      const result = await service.findAllReviews();

      // Assert
      expect(mockReviewRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(reviews);
    });
  });

  describe('findReviewsByType', () => {
    it('should return reviews by type', async () => {
      // Arrange
      const movieReviews = [createMockReview()];
      mockReviewRepo.find.mockResolvedValue(movieReviews);

      // Act
      const result = await service.findReviewsByType(ReviewableType.MOVIE);

      // Assert
      expect(mockReviewRepo.find).toHaveBeenCalledWith({
        where: { reviewableType: ReviewableType.MOVIE },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(movieReviews);
    });
  });

  describe('findReviewsByItem', () => {
    it('should return reviews for specific item', async () => {
      // Arrange
      const itemReviews = [createMockReview()];
      mockReviewRepo.find.mockResolvedValue(itemReviews);

      // Act
      const result = await service.findReviewsByItem(ReviewableType.MOVIE, 'movie-123');

      // Assert
      expect(mockReviewRepo.find).toHaveBeenCalledWith({
        where: {
          reviewableType: ReviewableType.MOVIE,
          reviewableId: 'movie-123',
        },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(itemReviews);
    });
  });

  describe('findUserReviews', () => {
    it('should return user reviews', async () => {
      // Arrange
      const userReviews = [createMockReview()];
      mockReviewRepo.find.mockResolvedValue(userReviews);

      // Act
      const result = await service.findUserReviews('user-123');

      // Assert
      expect(mockReviewRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(userReviews);
    });
  });

  describe('findOneReview', () => {
    it('should return review by id', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(createMockReview());

      // Act
      const result = await service.findOneReview('review-123');

      // Assert
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'review-123' },
      });
      expect(result).toMatchObject({
        id: 'review-123',
      });
    });

    it('should throw NotFoundException when review not found', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOneReview('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOneReview('invalid-id')).rejects.toThrow(
        'Review not found',
      );
    });
  });

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      // Arrange
      const updateDto: UpdateReviewDto = { rating: 5, comment: 'Updated comment' };
      const review = createMockReview();
      mockReviewRepo.findOne.mockResolvedValue(review);
      mockReviewRepo.save.mockResolvedValue(review);

      // Act
      const result = await service.updateReview('review-123', 'user-123', updateDto);

      // Assert
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'review-123', userId: 'user-123' },
      });
      expect(mockReviewRepo.save).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'review-123',
      });
    });

    it('should throw NotFoundException when review not found or unauthorized', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateReview('invalid-id', 'user-123', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      // Arrange
      const review = createMockReview();
      mockReviewRepo.findOne.mockResolvedValue(review);
      mockReviewRepo.remove.mockResolvedValue(review);

      // Act
      const result = await service.deleteReview('review-123', 'user-123');

      // Assert
      expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'review-123', userId: 'user-123' },
      });
      expect(mockReviewRepo.remove).toHaveBeenCalledWith(review);
      expect(result).toEqual({ message: 'Review deleted successfully' });
    });

    it('should throw NotFoundException when review not found or unauthorized', async () => {
      // Arrange
      mockReviewRepo.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteReview('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating and count', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ average: '4.5' }),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockReviewRepo.count.mockResolvedValue(10);

      // Act
      const result = await service.getAverageRating(ReviewableType.MOVIE, 'movie-123');

      // Assert
      expect(mockReviewRepo.createQueryBuilder).toHaveBeenCalledWith('review');
      expect(mockReviewRepo.count).toHaveBeenCalledWith({
        where: {
          reviewableType: ReviewableType.MOVIE,
          reviewableId: 'movie-123',
        },
      });
      expect(result).toEqual({
        average: '4.5',
        count: 10,
      });
    });

    it('should return 0.0 when no reviews exist', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ average: null }),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockReviewRepo.count.mockResolvedValue(0);

      // Act
      const result = await service.getAverageRating(ReviewableType.MOVIE, 'movie-123');

      // Assert
      expect(result).toEqual({
        average: '0.0',
        count: 0,
      });
    });
  });
});
