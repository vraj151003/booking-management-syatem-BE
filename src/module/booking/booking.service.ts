import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking-dto';
import { Show } from '../show/entity/show.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from './entity/booking.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BookingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    private redisService: RedisService,
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

      const booking = queryRunner.manager.create(Booking, {
        show,
        seats,
        totalAmount,
        status: 'CONFIRMED',
        user: { id: dto.userId },
      });

      const savedBooking = await queryRunner.manager.save(booking);
      await queryRunner.commitTransaction();

      // Remove locks after successful booking
      for (const seatId of dto.seatIds) {
        const key = `lock:${dto.showId}:${seatId}`;
        await this.redisService.deleteLock(key);
      }

      return {
        message: 'BOOKING SUCCESSFUL',
        data: savedBooking,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
}
