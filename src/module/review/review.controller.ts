import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { ReviewableType } from './entity/review.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @RequirePermissions('CREATE_REVIEW')
  @ApiOperation({ summary: 'Create a review for movie or theater' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(@Request() req, @Body() dto: CreateReviewDto) {
    return await this.reviewService.createReview(req.user.id, dto);
  }

  @Get()
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get all reviews with filters' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'reviewableType', required: false })
  @ApiQuery({ name: 'reviewableId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'userIds', required: false })
  async findAllReviews(@Query() filters: ReviewFilterDto) {
    return await this.reviewService.findAllReviews(filters);
  }

  @Get('movies')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get all movie reviews with filters' })
  @ApiResponse({ status: 200, description: 'Movie reviews retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'reviewableId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'userIds', required: false })
  async findMovieReviews(@Query() filters: ReviewFilterDto) {
    return await this.reviewService.findReviewsByType(ReviewableType.MOVIE, filters);
  }

  @Get('theaters')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get all theater reviews with filters' })
  @ApiResponse({ status: 200, description: 'Theater reviews retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'reviewableId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'userIds', required: false })
  async findTheaterReviews(@Query() filters: ReviewFilterDto) {
    return await this.reviewService.findReviewsByType(ReviewableType.THEATER, filters);
  }

  @Get('item/:type/:itemId')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get reviews for specific movie or theater with filters' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'userIds', required: false })
  async findReviewsByItem(
    @Param('type') type: ReviewableType,
    @Param('itemId') itemId: string,
    @Query() filters: ReviewFilterDto
  ) {
    return await this.reviewService.findReviewsByItem(type, itemId, filters);
  }

  @Get('item/:type/:itemId/average')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get average rating for movie or theater' })
  @ApiResponse({ status: 200, description: 'Average rating retrieved successfully' })
  async getAverageRating(
    @Param('type') type: ReviewableType,
    @Param('itemId') itemId: string,
  ) {
    return await this.reviewService.getAverageRating(type, itemId);
  }

  @Get('my-reviews')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get current user reviews with filters' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'reviewableType', required: false })
  @ApiQuery({ name: 'reviewableId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async findUserReviews(@Request() req, @Query() filters: ReviewFilterDto) {
    return await this.reviewService.findUserReviews(req.user.id, filters);
  }

  @Get(':id')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async findOneReview(@Param('id') id: string) {
    return await this.reviewService.findOneReview(id);
  }

  @Put(':id')
  @RequirePermissions('UPDATE_REVIEW')
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateReview(@Request() req, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return await this.reviewService.updateReview(id, req.user.id, dto);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_REVIEW')
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(@Request() req, @Param('id') id: string) {
    return await this.reviewService.deleteReview(id, req.user.id);
  }
}
