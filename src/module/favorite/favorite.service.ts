import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite, FavoritableType } from './entity/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
  ) {}

  async addFavorite(userId: string, dto: CreateFavoriteDto) {
    // Check if already favorited
    const existingFavorite = await this.favoriteRepo.findOne({
      where: {
        userId,
        favoritableType: dto.favoritableType,
        favoritableId: dto.favoritableId,
      },
    });

    if (existingFavorite) {
      throw new BadRequestException('Item already in favorites');
    }

    const favorite = this.favoriteRepo.create({
      userId,
      favoritableType: dto.favoritableType,
      favoritableId: dto.favoritableId,
    });

    return await this.favoriteRepo.save(favorite);
  }

  async findAllFavorites(userId: string) {
    return await this.favoriteRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findFavoritesByType(userId: string, type: FavoritableType) {
    return await this.favoriteRepo.find({
      where: {
        userId,
        favoritableType: type,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneFavorite(id: string, userId: string) {
    const favorite = await this.favoriteRepo.findOne({
      where: { id, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return favorite;
  }

  async removeFavorite(id: string, userId: string) {
    const favorite = await this.findOneFavorite(id, userId);
    await this.favoriteRepo.remove(favorite);
    return { message: 'Favorite removed successfully' };
  }

  async removeFavoriteByItem(userId: string, favoritableType: FavoritableType, favoritableId: string) {
    const favorite = await this.favoriteRepo.findOne({
      where: {
        userId,
        favoritableType,
        favoritableId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepo.remove(favorite);
    return { message: 'Favorite removed successfully' };
  }
}
