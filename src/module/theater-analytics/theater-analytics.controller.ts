import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TheaterAnalyticsService } from './theater-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('theater-analytics')
@Controller('theater-analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TheaterAnalyticsController {
  constructor(private readonly analyticsService: TheaterAnalyticsService) {}

  @Get('daily-revenue')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get daily revenue for theater owner' })
  @ApiResponse({ status: 200, description: 'Daily revenue retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getDailyRevenue(@Request() req, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    return await this.analyticsService.getDailyRevenue(theaterOwnerId, date);
  }

  @Get('occupancy-rate')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get occupancy rate for theater owner' })
  @ApiResponse({ status: 200, description: 'Occupancy rate retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getOccupancyRate(@Request() req, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    return await this.analyticsService.getOccupancyRate(theaterOwnerId, date);
  }

  @Get('top-movies')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get top movies for theater owner' })
  @ApiResponse({ status: 200, description: 'Top movies retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of top movies to return (default: 10)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getTopMovies(@Request() req, @Query('limit') limit?: string, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.analyticsService.getTopMovies(theaterOwnerId, limitNum, date);
  }

  @Get('top-shows')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get top shows for theater owner' })
  @ApiResponse({ status: 200, description: 'Top shows retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of top shows to return (default: 10)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getTopShows(@Request() req, @Query('limit') limit?: string, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    const limitNum = limit ? parseInt(limit) : 10;
    return await this.analyticsService.getTopShows(theaterOwnerId, limitNum, date);
  }

  @Get('cancellation-rate')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get cancellation rate for theater owner' })
  @ApiResponse({ status: 200, description: 'Cancellation rate retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getCancellationRate(@Request() req, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    return await this.analyticsService.getCancellationRate(theaterOwnerId, date);
  }

  @Get('overall')
  @RequirePermissions('VIEW_THEATER_BOOKINGS')
  @ApiOperation({ summary: 'Get overall analytics for theater owner' })
  @ApiResponse({ status: 200, description: 'Overall analytics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (default: today)' })
  async getOverallAnalytics(@Request() req, @Query('date') date?: string) {
    const theaterOwnerId = req.user.id;
    return await this.analyticsService.getOverallAnalytics(theaterOwnerId, date);
  }
}
