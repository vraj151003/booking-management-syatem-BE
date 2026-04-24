import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Booking } from './entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Seat } from '../seat/entity/seat.entity';
import { User } from '../users/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Show, Seat, User]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}