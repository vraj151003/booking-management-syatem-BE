import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Show } from './entity/show.entity';
import { ShowService } from './show.service';
import { ShowController } from './show.controller';
import { Movie } from '../movie/entity/movie.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from '../booking/entity/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Show, Movie, Screen, Seat, Booking])],
  providers: [ShowService],
  controllers: [ShowController],
})
export class ShowModule {}