import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID } from 'class-validator';
import { FavoritableType } from '../entity/favorite.entity';

export class CreateFavoriteDto {
  @ApiProperty({ enum: FavoritableType, description: 'Type of favoritable item' })
  @IsEnum(FavoritableType)
  favoritableType: FavoritableType;

  @ApiProperty({ description: 'ID of the movie or theater' })
  @IsString()
  @IsUUID()
  favoritableId: string;
}
