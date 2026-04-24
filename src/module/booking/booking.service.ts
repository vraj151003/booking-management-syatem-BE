import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking-dto';
import { Show } from '../show/entity/show.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from './entity/booking.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../payment/stripe/stripe.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentStatus } from '../payment/entity/payment.entity';
import { Payment } from '../payment/entity/payment.entity';

@Injectable()
export class BookingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    private redisService: RedisService,
    private stripeService: StripeService,
    private paymentService: PaymentService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    // Validate locks before booking
    for (const seatId of dto.seatIds) {
      const key = `lock:${dto.showId}:${seatId}`;
      const lock = await this.redisService.getLock(key);

      if (!lock || lock !== dto.userId) {
        throw new Error(`Seat ${seatId} not locked by user`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const show = await queryRunner.manager.findOne(Show, {
        where: { id: dto.showId },
        relations: ['screen'],
      });

      if (!show) {
        throw new NotFoundException('Show Not Found');
      }

      const seats = await queryRunner.manager
        .createQueryBuilder(Seat, 'seat')
        .where('seat.id IN (:...ids)', { ids: dto.seatIds })
        .setLock('pessimistic_write')
        .getMany();

      const existingBookings = await queryRunner.manager
        .createQueryBuilder(Booking, 'booking')
        .leftJoin('booking.seats', 'seat')
        .where('booking.showId = :showId', { showId: dto.showId })
        .andWhere('seat.id IN (:...seatIds)', { seatIds: dto.seatIds })
        .andWhere('booking.status = :status', { status: 'CONFIRMED' })
        .getMany();

      if (existingBookings.length > 0) {
        throw new Error('Some seat already booked');
      }

      let totalAmount = 0;
      for (const seat of seats) {
        totalAmount += show.pricing[seat.seatType] || 0;
      }

      const paymentIntent =
        await this.stripeService.createPaymentIntent(totalAmount);

      const booking = queryRunner.manager.create(Booking, {
        show,
        seats,
        totalAmount,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentIntentId: paymentIntent.id,
        user: { id: dto.userId },
      });

      const savedBooking = await queryRunner.manager.save(booking);

      // Create payment within the same transaction
      const payment = queryRunner.manager.create(Payment, {
        booking: savedBooking,
        user: { id: dto.userId } as any,
        amount: totalAmount,
        currency: 'INR',
        paymentIntentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
      });
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();

      return {
        message: 'Payment initiated',
        data: {
          booking: savedBooking,
          clientSecret: paymentIntent.client_secret,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async confrimBooking(paymentIntentId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { paymentIntentId },
      relations: ['seats', 'show'],
    });
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'PAID';

    await this.bookingRepo.save(booking);

    for (const seat of booking.seats) {
      const key = `lock:${booking.show.id}:${seat.id}`;
      await this.redisService.deleteLock(key);
    }

    return {
      message: 'Booking confirmed',
      data: booking,
    };
  }

  async lockSeats(showId: string, seatIds: string[], userId: string) {
    for (const seatId of seatIds) {
      const key = `lock:${showId}:${seatId}`;
      const existingLock = await this.redisService.getLock(key);
      if (existingLock) {
        throw new Error('Seat already locked');
      }

      // lock after 5 minutes
      await this.redisService.setLock(key, userId, 300);
    }
    return {
      message: 'Seats locked for 5 minutes',
    };
  }

  async findAllBookings() {
    const bookings = await this.bookingRepo.find({
      relations: ['user', 'show', 'show.movie', 'show.screen', 'seats'],
    });

    return {
      message: 'All bookings retrieved successfully',
      data: bookings,
    };
  }

  async findOneBooking(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['user', 'show', 'show.movie', 'show.screen', 'seats'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      message: 'Booking retrieved successfully',
      data: booking,
    };
  }

  async findBookingsByUser(userId: string) {
    const bookings = await this.bookingRepo.find({
      where: { user: { id: userId } },
      relations: ['user', 'show', 'show.movie', 'show.screen', 'seats'],
    });

    return {
      message: 'User bookings retrieved successfully',
      data: bookings,
    };
  }

  async findBookingsByTheaterOwner(theaterOwnerId: string) {
    const bookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.show', 'show')
      .leftJoinAndSelect('show.movie', 'movie')
      .leftJoinAndSelect('show.screen', 'screen')
      .leftJoinAndSelect('booking.seats', 'seats')
      .where('screen.theaterOwnerId = :theaterOwnerId', { theaterOwnerId })
      .getMany();

    return {
      message: 'Theater owner bookings retrieved successfully',
      data: bookings,
    };
  }

  async cancelBooking(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.status = 'CANCELLED';
    await this.bookingRepo.save(booking);

    return {
      message: 'Booking cancelled successfully',
      data: booking,
    };
  }

  async failBooking(paymentIntentId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { paymentIntentId },
      relations: ['seats', 'show'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CONFIRMED') {
      return;
    }

    booking.status = 'CANCELLED';
    booking.paymentStatus = 'FAILED';

    await this.bookingRepo.save(booking);

    for (const seat of booking.seats) {
      const key = `lock:${booking.show.id}:${seat.id}`;
      await this.redisService.deleteLock(key);
    }

    return {
      message: 'Booking marked as failed and locks released',
    };
  }
}
