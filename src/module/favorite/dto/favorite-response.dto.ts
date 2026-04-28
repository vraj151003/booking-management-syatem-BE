import { ApiProperty } from '@nestjs/swagger';
import { FavoritableType } from '../entity/favorite.entity';

export class FavoriteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: FavoritableType })
  favoritableType: FavoritableType;

  @ApiProperty()
  favoritableId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
