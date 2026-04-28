import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
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
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findAllReviews() {
    return await this.reviewService.findAllReviews();
  }

  @Get('movies')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get all movie reviews' })
  @ApiResponse({ status: 200, description: 'Movie reviews retrieved successfully' })
  async findMovieReviews() {
    return await this.reviewService.findReviewsByType(ReviewableType.MOVIE);
  }

  @Get('theaters')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get all theater reviews' })
  @ApiResponse({ status: 200, description: 'Theater reviews retrieved successfully' })
  async findTheaterReviews() {
    return await this.reviewService.findReviewsByType(ReviewableType.THEATER);
  }

  @Get('item/:type/:itemId')
  @RequirePermissions('READ_REVIEW')
  @ApiOperation({ summary: 'Get reviews for specific movie or theater' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findReviewsByItem(
    @Param('type') type: ReviewableType,
    @Param('itemId') itemId: string,
  ) {
    return await this.reviewService.findReviewsByItem(type, itemId);
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
  @ApiOperation({ summary: 'Get current user reviews' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully' })
  async findUserReviews(@Request() req) {
    return await this.reviewService.findUserReviews(req.user.id);
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
