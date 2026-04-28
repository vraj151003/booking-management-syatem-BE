import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking-dto';
import { ExportBookingsDto, ExportFilterType } from './dto/export-bookings-dto';
import { Show } from '../show/entity/show.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from './entity/booking.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../payment/stripe/stripe.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentStatus } from '../payment/entity/payment.entity';
import { Payment } from '../payment/entity/payment.entity';
import { NotificationService } from '../notification/notification.service';
import { CouponService } from '../coupon/coupon.service';
import * as puppeteer from 'puppeteer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as csvWriter from 'csv-writer';

@Injectable()
export class BookingService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,

    private redisService: RedisService,
    private stripeService: StripeService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private couponService: CouponService,
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

      // Validate show date and time
      const showDate = new Date(show.showDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if show date is in the past
      if (showDate < today) {
        throw new Error('Cannot book for past shows');
      }

      // Check if show is active
      if (!show.isActive) {
        throw new Error('Show is not available for booking');
      }

      // Validate show time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(show.startTime) || !timeRegex.test(show.endTime)) {
        throw new Error('Invalid show time format');
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

      let discountAmount = 0;
      let couponId: string | undefined = undefined;

      // Apply coupon if provided
      if (dto.couponCode) {
        try {
          const validationResult = await this.couponService.validateCoupon({
            code: dto.couponCode,
            orderAmount: totalAmount,
          });

          if (validationResult.valid) {
            discountAmount = validationResult.discountAmount;
            couponId = validationResult.couponId;
            totalAmount = validationResult.finalAmount;
          }
        } catch (error) {
          // If coupon is invalid, continue without discount
          console.error('Coupon validation failed:', error.message);
        }
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
        couponId,
        discountAmount,
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
      relations: ['seats', 'show', 'show.movie', 'show.screen', 'show.screen.theaterOwner', 'user'],
    });
    if (!booking) {
      throw new Error('Booking not found');
    }
    booking.status = 'CONFIRMED';
    booking.paymentStatus = 'PAID';

    await this.bookingRepo.save(booking);

    // Increment coupon usage if coupon was applied
    if (booking.couponId) {
      try {
        await this.couponService.incrementUsage(booking.couponId);
      } catch (error) {
        console.error('Failed to increment coupon usage:', error);
      }
    }

    for (const seat of booking.seats) {
      const key = `lock:${booking.show.id}:${seat.id}`;
      await this.redisService.deleteLock(key);
    }

    // Send notifications to customer and theater owner
    try {
      await this.notificationService.sendBookingNotifications({
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        customerEmail: booking.user.email,
        theaterOwnerEmail: booking.show.screen.theaterOwner.email,
        movieName: booking.show.movie.name,
        showDate: booking.show.showDate,
        showTime: booking.show.startTime,
        screenName: booking.show.screen.name,
        seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
        totalAmount: booking.totalAmount,
        bookingId: booking.id,
      });
    } catch (error) {
      console.error('Failed to send notifications:', error);
      // Don't throw error to avoid failing the booking process
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

  async generateTicketPdf(bookingId: string): Promise<Buffer> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['user', 'show', 'show.movie', 'show.screen', 'show.screen.theaterOwner', 'seats'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Generate QR code with validation URL
    let qrCodeImage: string = '';
    try {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
      const validationUrl = `${baseUrl}/bookings/${bookingId}/validate`;
      const qrCodeBuffer = await QRCode.toBuffer(validationUrl, {
        width: 200,
        margin: 1,
      });
      qrCodeImage = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Render EJS template to HTML
    const templatePath = path.join(process.cwd(), 'views/booking-ticket.ejs');
    const html = await ejs.renderFile(templatePath, { booking, qrCodeImage });

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await page.close();
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async validateBarcode(bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['user', 'show', 'show.movie', 'show.screen', 'show.screen.theaterOwner', 'seats'],
    });

    if (!booking) {
      throw new NotFoundException('Invalid booking ID');
    }

    // Check if booking is already used
    if (booking.isUsed) {
      return {
        valid: false,
        booking: {
          id: booking.id,
          movieTitle: booking.show.movie.name,
          showDate: booking.show.showDate,
          showTime: booking.show.startTime,
          screen: booking.show.screen.name,
          theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
          seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
        },
        message: 'Already scanned',
      };
    }

    // Check if booking is valid for entry
    const isValid = booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';

    if (!isValid) {
      return {
        valid: false,
        booking: {
          id: booking.id,
          movieTitle: booking.show.movie.name,
          showDate: booking.show.showDate,
          showTime: booking.show.startTime,
          screen: booking.show.screen.name,
          theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
          seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
        },
        message: 'Invalid or expired ticket',
      };
    }

    // Date and time validation
    const now = new Date();
    const showDate = new Date(booking.show.showDate);
    const showStartTime = new Date(`${booking.show.showDate}T${booking.show.startTime}`);
    const showEndTime = new Date(`${booking.show.showDate}T${booking.show.endTime}`);

    // Check if show date is not today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const showDay = new Date(showDate.getFullYear(), showDate.getMonth(), showDate.getDate());

    if (showDay.getTime() !== today.getTime()) {
      return {
        valid: false,
        booking: {
          id: booking.id,
          movieTitle: booking.show.movie.name,
          showDate: booking.show.showDate,
          showTime: booking.show.startTime,
          screen: booking.show.screen.name,
          theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
          seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
        },
        message: 'Show is not for today',
      };
    }

    // Check if too early (30 minutes before show start)
    const thirtyMinutesBeforeShow = new Date(showStartTime.getTime() - 30 * 60 * 1000);
    if (now < thirtyMinutesBeforeShow) {
      return {
        valid: false,
        booking: {
          id: booking.id,
          movieTitle: booking.show.movie.name,
          showDate: booking.show.showDate,
          showTime: booking.show.startTime,
          screen: booking.show.screen.name,
          theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
          seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
        },
        message: 'Too early - entry allowed 30 minutes before show',
      };
    }

    // Check if expired (after show end time)
    if (now > showEndTime) {
      return {
        valid: false,
        booking: {
          id: booking.id,
          movieTitle: booking.show.movie.name,
          showDate: booking.show.showDate,
          showTime: booking.show.startTime,
          screen: booking.show.screen.name,
          theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
          seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
          customerName: `${booking.user.firstName} ${booking.user.lastName}`,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          totalAmount: booking.totalAmount,
        },
        message: 'Expired - show has ended',
      };
    }

    // Mark ticket as used
    booking.isUsed = true;
    await this.bookingRepo.save(booking);

    return {
      valid: true,
      booking: {
        id: booking.id,
        movieTitle: booking.show.movie.name,
        showDate: booking.show.showDate,
        showTime: booking.show.startTime,
        screen: booking.show.screen.name,
        theatre: booking.show.screen.theaterOwner.theatreName || 'Grand Cinema',
        seats: booking.seats.map(seat => `${seat.row}${seat.seatNumber}`),
        customerName: `${booking.user.firstName} ${booking.user.lastName}`,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: booking.totalAmount,
      },
      message: 'Valid Entry',
    };
  }

  async exportBookingsToCsv(theaterOwnerId: string, filters: ExportBookingsDto): Promise<Buffer> {
    const queryBuilder = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.show', 'show')
      .leftJoinAndSelect('show.movie', 'movie')
      .leftJoinAndSelect('show.screen', 'screen')
      .leftJoinAndSelect('screen.theaterOwner', 'theaterOwner')
      .leftJoinAndSelect('booking.seats', 'seats')
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId });

    // Apply date filters only if filterType is provided
    if (filters.filterType) {
      const now = new Date();
      let startDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      switch (filters.filterType) {
        case ExportFilterType.TODAY:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case ExportFilterType.WEEK:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case ExportFilterType.MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case ExportFilterType.YEAR:
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case ExportFilterType.CUSTOM:
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59);
          }
          break;
      }

      if (startDate) {
        queryBuilder.andWhere('booking.createdAt >= :startDate', { startDate });
        queryBuilder.andWhere('booking.createdAt <= :endDate', { endDate });
      }
    }

    // Apply additional filters
    if (filters.movieId) {
      queryBuilder.andWhere('movie.id = :movieId', { movieId: filters.movieId });
    }

    if (filters.screenId) {
      queryBuilder.andWhere('screen.id = :screenId', { screenId: filters.screenId });
    }

    if (filters.status) {
      queryBuilder.andWhere('booking.status = :status', { status: filters.status });
    }

    if (filters.paymentStatus) {
      queryBuilder.andWhere('booking.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }

    const bookings = await queryBuilder.getMany();

    // Prepare CSV data
    const csvData = bookings.map(booking => ({
      'Booking ID': booking.id,
      'Movie Name': booking.show.movie.name,
      'Show Date': booking.show.showDate,
      'Show Time': booking.show.startTime,
      'Screen': booking.show.screen.name,
      'Seats': booking.seats.map(seat => `${seat.row}${seat.seatNumber}`).join(', '),
      'Customer Name': `${booking.user.firstName} ${booking.user.lastName}`,
      'Customer Email': booking.user.email,
      'Total Amount': booking.totalAmount,
      'Status': booking.status,
      'Payment Status': booking.paymentStatus,
      'Booking Date': booking.createdAt ? booking.createdAt.toISOString() : '',
      'Is Used': booking.isUsed ? 'Yes' : 'No',
    }));

    // Generate CSV
    const csvFilePath = `/tmp/bookings-export-${Date.now()}.csv`;
    const writer = csvWriter.createObjectCsvWriter({
      path: csvFilePath,
      header: [
        { id: 'Booking ID', title: 'Booking ID' },
        { id: 'Movie Name', title: 'Movie Name' },
        { id: 'Show Date', title: 'Show Date' },
        { id: 'Show Time', title: 'Show Time' },
        { id: 'Screen', title: 'Screen' },
        { id: 'Seats', title: 'Seats' },
        { id: 'Customer Name', title: 'Customer Name' },
        { id: 'Customer Email', title: 'Customer Email' },
        { id: 'Total Amount', title: 'Total Amount' },
        { id: 'Status', title: 'Status' },
        { id: 'Payment Status', title: 'Payment Status' },
        { id: 'Booking Date', title: 'Booking Date' },
        { id: 'Is Used', title: 'Is Used' },
      ],
    });

    await writer.writeRecords(csvData);

    // Read CSV file and return as buffer
    const fs = require('fs');
    const csvBuffer = fs.readFileSync(csvFilePath);
    
    // Clean up temp file
    fs.unlinkSync(csvFilePath);

    return csvBuffer;
  }
}
