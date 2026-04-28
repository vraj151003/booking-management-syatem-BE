import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewableType } from './entity/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Booking } from '../booking/entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Screen } from '../screen/entity/screen.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Show)
    private readonly showRepo: Repository<Show>,
    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,
  ) {}

  private async validateUserBooking(
    userId: string,
    reviewableType: ReviewableType,
    reviewableId: string,
  ): Promise<boolean> {
    if (reviewableType === ReviewableType.MOVIE) {
      // Check if user has a booking for a show of this movie
      const bookings = await this.bookingRepo
        .createQueryBuilder('booking')
        .innerJoin('booking.show', 'show')
        .where('booking.userId = :userId', { userId })
        .andWhere('show.movieId = :movieId', { movieId: reviewableId })
        .andWhere('booking.status = :status', { status: 'CONFIRMED' })
        .getMany();

      return bookings.length > 0;
    } else if (reviewableType === ReviewableType.THEATER) {
      // Check if user has a booking for a show at this theater
      const bookings = await this.bookingRepo
        .createQueryBuilder('booking')
        .innerJoin('booking.show', 'show')
        .innerJoin('show.screen', 'screen')
        .where('booking.userId = :userId', { userId })
        .andWhere('screen.theaterId = :theaterId', { theaterId: reviewableId })
        .andWhere('booking.status = :status', { status: 'CONFIRMED' })
        .getMany();

      return bookings.length > 0;
    }

    return false;
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    // Check if user has already reviewed this item
    const existingReview = await this.reviewRepo.findOne({
      where: {
        userId,
        reviewableType: dto.reviewableType,
        reviewableId: dto.reviewableId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this item');
    }

    // Validate that user has a booking for this movie/theater
    const hasBooking = await this.validateUserBooking(
      userId,
      dto.reviewableType,
      dto.reviewableId,
    );

    if (!hasBooking) {
      throw new ForbiddenException(
        'You can only review movies and theaters you have booked',
      );
    }

    const review = this.reviewRepo.create({
      userId,
      reviewableType: dto.reviewableType,
      reviewableId: dto.reviewableId,
      rating: dto.rating,
      comment: dto.comment,
    });

    return await this.reviewRepo.save(review);
  }

  async findAllReviews() {
    return await this.reviewRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findReviewsByType(type: ReviewableType) {
    return await this.reviewRepo.find({
      where: { reviewableType: type },
      order: { createdAt: 'DESC' },
    });
  }

  async findReviewsByItem(
    reviewableType: ReviewableType,
    reviewableId: string,
  ) {
    return await this.reviewRepo.find({
      where: {
        reviewableType,
        reviewableId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findUserReviews(userId: string) {
    return await this.reviewRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneReview(id: string) {
    const review = await this.reviewRepo.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateReview(id: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.reviewRepo.findOne({
      where: { id, userId },
    });

    if (!review) {
      throw new NotFoundException(
        'Review not found or you do not have permission to update it',
      );
    }

    Object.assign(review, dto);

    return await this.reviewRepo.save(review);
  }

  async deleteReview(id: string, userId: string) {
    const review = await this.reviewRepo.findOne({
      where: { id, userId },
    });

    if (!review) {
      throw new NotFoundException(
        'Review not found or you do not have permission to delete it',
      );
    }

    await this.reviewRepo.remove(review);
    return { message: 'Review deleted successfully' };
  }

  async getAverageRating(reviewableType: ReviewableType, reviewableId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.reviewableType = :type', { type: reviewableType })
      .andWhere('review.reviewableId = :id', { id: reviewableId })
      .getRawOne();

    return {
      average: result.average ? parseFloat(result.average).toFixed(1) : '0.0',
      count: await this.reviewRepo.count({
        where: {
          reviewableType,
          reviewableId,
        },
      }),
    };
  }
}
