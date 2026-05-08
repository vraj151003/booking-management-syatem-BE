import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe/stripe.service';
import { StripeController } from './stripe/stripe.controller';
import { Payment } from './entity/payment.entity';
import { Booking } from '../booking/entity/booking.entity';
import { User } from '../users/entity/user.entity';
import { BookingModule } from '../booking/booking.module';
import { ConcessionModule } from '../concession/concession.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Booking, User]),
    forwardRef(() => BookingModule),
    forwardRef(() => ConcessionModule),
    FirebaseModule,
  ],
  controllers: [StripeController],
  providers: [PaymentService, StripeService],
  exports: [PaymentService, StripeService],
})
export class PaymentModule {}
