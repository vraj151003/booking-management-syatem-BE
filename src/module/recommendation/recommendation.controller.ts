import { 
  Controller, 
  Get, 
  Query, 
  UseGuards, 
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  GetRecommendationsDto, 
  RecommendationResponseDto, 
  RecommendationStatsDto,
  RecommendationType 
} from './dto/recommendation.dto';

@ApiTags('recommendations')
@ApiBearerAuth()
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized/:userId')
  @ApiOperation({ summary: 'Get personalized recommendations for specific user' })
  @ApiResponse({ status: 200, description: 'Personalized recommendations retrieved successfully' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPersonalizedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<{ recommendations: RecommendationResponseDto[]; stats: RecommendationStatsDto }> {
    const limitNum = limit ? parseInt(limit) : 10;
    
    const recommendations = await this.recommendationService.getPersonalizedRecommendations(userId, limitNum);
    
    const stats: RecommendationStatsDto = {
      totalRecommendations: recommendations.length,
      type: RecommendationType.PERSONALIZED,
      userId,
      generatedAt: new Date(),
    };

    return { recommendations, stats };
  }

  @Get('genre-based/:userId')
  @ApiOperation({ summary: 'Get genre-based recommendations for user' })
  @ApiResponse({ status: 200, description: 'Genre-based recommendations retrieved successfully' })
  @ApiParam({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getGenreBasedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ): Promise<{ recommendations: RecommendationResponseDto[]; stats: RecommendationStatsDto }> {
    const limitNum = limit ? parseInt(limit) : 10;
    
    const recommendations = await this.recommendationService.getGenreBasedRecommendations(userId, limitNum);
    
    const stats: RecommendationStatsDto = {
      totalRecommendations: recommendations.length,
      type: RecommendationType.GENRE_BASED,
      userId,
      generatedAt: new Date(),
    };

    return { recommendations, stats };
  }
}
