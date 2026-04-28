import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritableType } from './entity/favorite.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permission/guards/permission.guard';
import { RequirePermissions } from '../permission/decorators/permissions.decorator';

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @RequirePermissions('CREATE_FAVORITE')
  @ApiOperation({ summary: 'Add item to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  async addFavorite(@Request() req, @Body() dto: CreateFavoriteDto) {
    return await this.favoriteService.addFavorite(req.user.id, dto);
  }

  @Get()
  @RequirePermissions('READ_FAVORITE')
  @ApiOperation({ summary: 'Get all user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async findAllFavorites(@Request() req) {
    return await this.favoriteService.findAllFavorites(req.user.id);
  }

  @Get('movies')
  @RequirePermissions('READ_FAVORITE')
  @ApiOperation({ summary: 'Get favorite movies' })
  @ApiResponse({ status: 200, description: 'Favorite movies retrieved successfully' })
  async findFavoriteMovies(@Request() req) {
    return await this.favoriteService.findFavoritesByType(req.user.id, FavoritableType.MOVIE);
  }

  @Get('theaters')
  @RequirePermissions('READ_FAVORITE')
  @ApiOperation({ summary: 'Get favorite theaters' })
  @ApiResponse({ status: 200, description: 'Favorite theaters retrieved successfully' })
  async findFavoriteTheaters(@Request() req) {
    return await this.favoriteService.findFavoritesByType(req.user.id, FavoritableType.THEATER);
  }

  @Get(':id')
  @RequirePermissions('READ_FAVORITE')
  @ApiOperation({ summary: 'Get favorite by ID' })
  @ApiResponse({ status: 200, description: 'Favorite retrieved successfully' })
  async findOneFavorite(@Request() req, @Param('id') id: string) {
    return await this.favoriteService.findOneFavorite(id, req.user.id);
  }

  @Delete(':id')
  @RequirePermissions('DELETE_FAVORITE')
  @ApiOperation({ summary: 'Remove favorite by ID' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async removeFavorite(@Request() req, @Param('id') id: string) {
    return await this.favoriteService.removeFavorite(id, req.user.id);
  }

  @Delete('item/:type/:itemId')
  @RequirePermissions('DELETE_FAVORITE')
  @ApiOperation({ summary: 'Remove favorite by item type and ID' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  async removeFavoriteByItem(
    @Request() req,
    @Param('type') type: FavoritableType,
    @Param('itemId') itemId: string,
  ) {
    return await this.favoriteService.removeFavoriteByItem(req.user.id, type, itemId);
  }
}
