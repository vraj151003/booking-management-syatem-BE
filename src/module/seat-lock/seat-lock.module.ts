import { Module } from '@nestjs/common';
import { SeatLockGateway } from './seat-lock.gateway';
import { RedisModule } from '../redis/redis.module';
import { BookingModule } from '../booking/booking.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    RedisModule,
    forwardRef(() => BookingModule),
  ],
  providers: [SeatLockGateway],
  exports: [SeatLockGateway],
})
export class SeatLockModule {}
