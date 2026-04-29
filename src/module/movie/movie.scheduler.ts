import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MovieService } from './movie.service';

@Injectable()
export class MovieScheduler {
  private readonly logger = new Logger(MovieScheduler.name);

  constructor(private readonly movieService: MovieService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMovieStatusTransition() {
    this.logger.log('Starting movie status transition job...');
    try {
      const result = await this.movieService.transitionMoviesToRunning();
      this.logger.log(result.message);
    } catch (error) {
      this.logger.error('Error transitioning movies to running status:', error);
    }
  }
}
