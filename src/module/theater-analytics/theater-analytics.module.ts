import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TheaterAnalyticsService } from './theater-analytics.service';
import { TheaterAnalyticsController } from './theater-analytics.controller';
import { Booking } from '../booking/entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Movie } from '../movie/entity/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Show, Screen, Movie])],
  controllers: [TheaterAnalyticsController],
  providers: [TheaterAnalyticsService],
  exports: [TheaterAnalyticsService],
})
export class TheaterAnalyticsModule {}
