import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum RecommendationType {
  PERSONALIZED = 'PERSONALIZED',
  SIMILAR_USERS = 'SIMILAR_USERS',
  TRENDING = 'TRENDING',
  GENRE_BASED = 'GENRE_BASED',
  POPULAR = 'POPULAR',
}

export class GetRecommendationsDto {
  @IsString()
  userId: string;

  @IsEnum(RecommendationType)
  @IsOptional()
  type?: RecommendationType = RecommendationType.PERSONALIZED;

  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @IsString()
  @IsOptional()
  genre?: string;

  @IsString()
  @IsOptional()
  movieId?: string;
}

export class RecommendationResponseDto {
  movieId: string;
  title: string;
  score: number;
  reason: string;
  genre: string;
  rating: number;
  poster?: string;
  releaseDate?: Date;
  duration?: number;
}

export class RecommendationStatsDto {
  totalRecommendations: number;
  type: RecommendationType;
  userId?: string;
  movieId?: string;
  genre?: string;
  generatedAt: Date;
}

export class UserPreferenceDto {
  userId: string;
  genre: string;
  score: number;
  moviesWatched: number;
  lastWatchDate: Date;
}

export class SimilarUserDto {
  userId: string;
  similarity: number;
  commonMovies: number;
  recommendedMovies: string[];
}
