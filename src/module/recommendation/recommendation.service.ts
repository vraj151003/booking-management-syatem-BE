import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from '../booking/entity/booking.entity';
import { Movie } from '../movie/entity/movie.entity';
import { User } from '../users/entity/user.entity';
import { Show } from '../show/entity/show.entity';

export interface RecommendationResult {
  movieId: string;
  title: string;
  score: number;
  reason: string;
  genre: string;
  rating: number;
  poster?: string;
}

export interface UserMoviePreference {
  userId: string;
  movieId: string;
  score: number;
  watchedAt: Date;
}

export interface SimilarUser {
  userId: string;
  similarity: number;
  commonMovies: string[];
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * Get personalized movie recommendations for a user based on collaborative filtering
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Get user's booking history
      const userPreferences = await this.getUserMoviePreferences(userId);
      
      if (userPreferences.length === 0) {
        // New user - return popular movies
        return await this.getPopularMovies(limit);
      }

      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, userPreferences);
      
      // Get recommendations from similar users
      const recommendations = await this.generateRecommendationsFromSimilarUsers(
        userId, 
        similarUsers, 
        userPreferences, 
        limit
      );

      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error(`Error generating personalized recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get genre-based recommendations for a user
   */
  async getGenreBasedRecommendations(userId: string, limit: number = 10): Promise<RecommendationResult[]> {
    try {
      // Analyze user's preferred genres from booking history
      const genrePreferences = await this.getUserGenrePreferences(userId);
      
      if (genrePreferences.length === 0) {
        return await this.getPopularMovies(limit);
      }

      const preferredGenres = genrePreferences.map((gp: any) => gp.genre);

      // Get movies in user's preferred genres they haven't watched
      const results = await this.movieRepo
        .createQueryBuilder('movie')
        .leftJoin('movie.shows', 'show')
        .leftJoin('show.bookings', 'booking')
        .select([
          'movie.id',
          'movie.name',
          'movie.genre',
          'movie.rating',
          'movie.poster'
        ])
        .where('movie.genre = ANY(:preferredGenres)', { preferredGenres })
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('show.movie_id')
            .from('shows', 'show')
            .leftJoin('show.bookings', 'booking')
            .where('booking.user_id = :userId', { userId })
            .getQuery();
          return `movie.id NOT IN ${subQuery}`;
        })
        .andWhere('movie.isActive = :isActive', { isActive: true })
        .andWhere('movie.status = :status', { status: 'RUNNING' })
        .orderBy('movie.rating', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((row: any) => ({
        movieId: row.movie_id,
        title: row.movie_name,
        score: row.movie_rating,
        reason: `Based on your interest in ${genrePreferences[0]?.genre}`,
        genre: row.movie_genre,
        rating: row.movie_rating,
        poster: row.movie_poster?.[0],
      }));
    } catch (error) {
      this.logger.error(`Error getting genre-based recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's movie preferences from booking history
   */
  private async getUserMoviePreferences(userId: string): Promise<UserMoviePreference[]> {
    const results = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.show', 'show')
      .leftJoin('show.movie', 'movie')
      .leftJoin('booking.user', 'user')
      .select([
        'user.id as user_id',
        'movie.id as movie_id',
        'movie.rating as movie_rating',
        'movie.genre',
        'booking.createdAt as watched_at',
        `CASE 
          WHEN booking.status = 'CONFIRMED' THEN 1.0
          WHEN booking.status = 'COMPLETED' THEN 1.0
          ELSE 0.5
        END as score`
      ])
      .where('user.id = :userId', { userId })
      .andWhere('booking.isUsed = :isUsed', { isUsed: true })
      .orderBy('booking.createdAt', 'DESC')
      .getRawMany();

    return results.map((row: any) => ({
      userId: row.user_id,
      movieId: row.movie_id,
      score: parseFloat(row.score) * (row.movie_rating / 5), // Weight by movie rating
      watchedAt: new Date(row.watched_at),
    }));
  }

  /**
   * Find users with similar movie preferences using cosine similarity
   */
  private async findSimilarUsers(userId: string, userPreferences: UserMoviePreference[]): Promise<SimilarUser[]> {
    const userMovieIds = userPreferences.map((up: any) => up.movieId);
    
    // Get other users who have watched similar movies
    const results = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.show', 'show')
      .select([
        'booking.user_id as other_user_id',
        'COUNT(*) as common_movies',
        `AVG(CASE 
          WHEN booking.status = 'CONFIRMED' THEN 1.0
          WHEN booking.status = 'COMPLETED' THEN 1.0
          ELSE 0.5
        END) as avg_other_score`
      ])
      .where('show.movie_id = ANY(:userMovieIds)', { userMovieIds })
      .andWhere('booking.user_id != :userId', { userId })
      .andWhere('booking.is_used = :isUsed', { isUsed: true })
      .groupBy('booking.user_id')
      .having('COUNT(*) >= :minCommonMovies', { minCommonMovies: 2 }) // At least 2 movies in common
      .orderBy('common_movies', 'DESC')
      .addOrderBy('avg_other_score', 'DESC')
      .limit(20)
      .getRawMany();

    const userMovieSet = new Set(userMovieIds);

    return results.map((row: any) => {
      // For simplicity, using Jaccard similarity based on common movies count
      const similarity = row.common_movies > 0 ? row.common_movies / 20 : 0; // Normalize by total possible movies
      
      return {
        userId: row.other_user_id,
        similarity: similarity,
        commonMovies: row.common_movies || [],
      };
    }).filter((user: any) => user.similarity > 0.1); // Filter by similarity threshold
  }

  /**
   * Calculate cosine similarity between two user preference vectors
   */
  private calculateCosineSimilarity(
    user1Prefs: UserMoviePreference[], 
    user2Prefs: UserMoviePreference[], 
    commonMovies: string[]
  ): number {
    if (commonMovies.length === 0) return 0;

    // For simplicity, using Jaccard similarity instead of full cosine similarity
    const user1Movies = new Set(user1Prefs.map((p: any) => p.movieId));
    const user2Movies = new Set(user2Prefs.map((p: any) => p.movieId));
    
    const intersection = commonMovies.length;
    const union = user1Movies.size + user2Movies.size - intersection;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Generate recommendations from similar users
   */
  private async generateRecommendationsFromSimilarUsers(
    userId: string,
    similarUsers: SimilarUser[],
    userPreferences: UserMoviePreference[],
    limit: number
  ): Promise<RecommendationResult[]> {
    const watchedMovieIds = new Set(userPreferences.map((up: any) => up.movieId));
    
    if (similarUsers.length === 0) {
      return await this.getPopularMovies(limit);
    }

    const similarUserIds = similarUsers.map((su: any) => su.userId);
    const watchedMovieIdsArray = Array.from(watchedMovieIds);

    const results = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoin('movie.shows', 'show')
      .leftJoin('show.bookings', 'booking')
      .select([
        'movie.id',
        'movie.name',
        'movie.genre',
        'movie.rating',
        'movie.poster',
        'COUNT(*) as recommendation_count'
      ])
      .where('booking.user_id = ANY(:similarUserIds)', { similarUserIds })
      .andWhere('movie.id NOT IN (:...watchedMovieIdsArray)', { watchedMovieIdsArray })
      .andWhere('movie.isActive = :isActive', { isActive: true })
      .andWhere('movie.status = :status', { status: 'RUNNING' })
      .groupBy('movie.id')
      .orderBy('recommendation_count', 'DESC')
      .addOrderBy('movie.rating', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row: any) => ({
      movieId: row.movie_id,
      title: row.movie_name,
      score: parseFloat(row.recommendation_count),
      reason: `Recommended based on similar users' preferences`,
      genre: row.movie_genre,
      rating: row.movie_rating,
      poster: row.movie_poster?.[0],
    }));
  }

  /**
   * Get user's genre preferences from booking history
   */
  private async getUserGenrePreferences(userId: string): Promise<{ genre: string; score: number }[]> {
    const results = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.show', 'show')
      .leftJoin('show.movie', 'movie')
      .leftJoin('booking.user', 'user')
      .select([
        'movie.genre',
        'COUNT(*) as watch_count',
        'AVG(movie.rating) as avg_rating'
      ])
      .where('user.id = :userId', { userId })
      .andWhere('booking.isUsed = :isUsed', { isUsed: true })
      .groupBy('movie.genre')
      .orderBy('watch_count', 'DESC')
      .addOrderBy('avg_rating', 'DESC')
      .getRawMany();
    
    return results.map((row: any) => ({
      genre: row.movie_genre,
      score: parseFloat(row.watch_count),
    }));
  }

  /**
   * Get popular movies as fallback for new users
   */
  private async getPopularMovies(limit: number): Promise<RecommendationResult[]> {
    const results = await this.movieRepo
      .createQueryBuilder('movie')
      .leftJoin('movie.shows', 'show')
      .leftJoin('show.bookings', 'booking')
      .select([
        'movie.id',
        'movie.name',
        'movie.genre',
        'movie.rating',
        'movie.poster',
        'COUNT(booking.id) as booking_count',
        'AVG(movie.rating) as avg_rating'
      ])
      .where('movie.isActive = :isActive', { isActive: true })
      .andWhere('movie.status = :status', { status: 'RUNNING' })
      .groupBy('movie.id')
      .orderBy('booking_count', 'DESC')
      .addOrderBy('avg_rating', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((row: any) => ({
      movieId: row.movie_id,
      title: row.movie_name,
      score: (parseFloat(row.booking_count) || 0) / 10, // Normalize score
      reason: 'Popular movies',
      genre: row.movie_genre || 'Unknown',
      rating: parseFloat(row.avg_rating) || 0,
      poster: row.movie_poster?.[0],
    }));
  }
}
