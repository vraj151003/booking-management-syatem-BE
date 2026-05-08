import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Booking } from './entity/booking.entity';
import { AuditModule } from '../audit/audit.module';
import { Show } from '../show/entity/show.entity';
import { Seat } from '../seat/entity/seat.entity';
import { User } from '../users/entity/user.entity';
import { RedisModule } from '../redis/redis.module';
import { PaymentModule } from '../payment/payment.module';
import { NotificationModule } from '../notification/notification.module';
import { CouponModule } from '../coupon/coupon.module';
import { PricingModule } from '../pricing/pricing.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Show, Seat, User]),
    RedisModule,
    forwardRef(() => PaymentModule),
    NotificationModule,
    CouponModule,
    PricingModule,
    AuditModule,
    FirebaseModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}