import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowService } from './show.service';
import { ShowController } from './show.controller';
import { Show } from './entity/show.entity';
import { AuditModule } from '../audit/audit.module';
import { Screen } from '../screen/entity/screen.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from '../booking/entity/booking.entity';
import { Movie } from '../movie/entity/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Show, Screen, Seat, Booking, Movie]), AuditModule],
  providers: [ShowService],
  controllers: [ShowController],
})
export class ShowModule {}