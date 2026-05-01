import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../booking/entity/booking.entity';
import { Show } from '../show/entity/show.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Movie } from '../movie/entity/movie.entity';

@Injectable()
export class TheaterAnalyticsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Show)
    private showRepo: Repository<Show>,
    @InjectRepository(Screen)
    private screenRepo: Repository<Screen>,
    @InjectRepository(Movie)
    private movieRepo: Repository<Movie>,
  ) {}

  async getDailyRevenue(theaterOwnerId: string, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const result = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.show', 'show')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .select([
        'DATE(booking.createdAt) as date',
        'SUM(booking.totalAmount) as revenue',
        'COUNT(booking.id) as totalBookings',
      ])
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .andWhere('DATE(booking.createdAt) = :date', { date: queryDate })
      .groupBy('DATE(booking.createdAt)')
      .getRawOne();

    return {
      date: queryDate,
      revenue: result?.revenue || 0,
      totalBookings: parseInt(result?.totalBookings || '0'),
    };
  }

  async getOccupancyRate(theaterOwnerId: string, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const shows = await this.showRepo
      .createQueryBuilder('show')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .leftJoin('show.bookings', 'booking')
      .select([
        'show.id',
        'show.showDate',
        'show.startTime',
        'screen.totalSeats',
        'COUNT(DISTINCT booking.id) as bookedSeats',
      ])
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('show.showDate = :date', { date: queryDate })
      .andWhere('show.isActive = :isActive', { isActive: true })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .groupBy('show.id, screen.totalSeats')
      .getRawMany();

    let totalSeats = 0;
    let totalBookedSeats = 0;

    shows.forEach((show) => {
      totalSeats += parseInt(show.screen_totalSeats);
      totalBookedSeats += parseInt(show.bookedSeats || '0');
    });

    const occupancyRate = totalSeats > 0 ? (totalBookedSeats / totalSeats) * 100 : 0;

    return {
      date: queryDate,
      totalSeats,
      totalBookedSeats,
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
      showDetails: shows.map((show) => ({
        showId: show.show_id,
        showDate: show.show_showDate,
        startTime: show.show_startTime,
        totalSeats: parseInt(show.screen_totalSeats),
        bookedSeats: parseInt(show.bookedSeats || '0'),
        occupancyRate: parseFloat(
          ((parseInt(show.bookedSeats || '0') / parseInt(show.screen_totalSeats)) * 100).toFixed(2),
        ),
      })),
    };
  }

  async getTopMovies(theaterOwnerId: string, limit: number = 10, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const result = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.show', 'show')
      .innerJoin('show.movie', 'movie')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .select([
        'movie.id',
        'movie.title',
        'movie.genre',
        'COUNT(DISTINCT booking.id) as totalBookings',
        'SUM(booking.totalAmount) as totalRevenue',
      ])
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .andWhere('DATE(booking.createdAt) = :date', { date: queryDate })
      .groupBy('movie.id, movie.title, movie.genre')
      .orderBy('totalRevenue', 'DESC')
      .addOrderBy('totalBookings', 'DESC')
      .limit(limit)
      .getRawMany();

    return {
      date: queryDate,
      topMovies: result.map((item) => ({
        movieId: item.movie_id,
        title: item.movie_title,
        genre: item.movie_genre,
        totalBookings: parseInt(item.totalBookings),
        totalRevenue: parseFloat(item.totalRevenue),
      })),
    };
  }

  async getTopShows(theaterOwnerId: string, limit: number = 10, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const result = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.show', 'show')
      .innerJoin('show.movie', 'movie')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .select([
        'show.id',
        'show.showDate',
        'show.startTime',
        'movie.title as movieTitle',
        'screen.name as screenName',
        'COUNT(DISTINCT booking.id) as totalBookings',
        'SUM(booking.totalAmount) as totalRevenue',
      ])
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('booking.status = :status', { status: 'CONFIRMED' })
      .andWhere('DATE(booking.createdAt) = :date', { date: queryDate })
      .groupBy('show.id, show.showDate, show.startTime, movie.title, screen.name')
      .orderBy('totalRevenue', 'DESC')
      .addOrderBy('totalBookings', 'DESC')
      .limit(limit)
      .getRawMany();

    return {
      date: queryDate,
      topShows: result.map((item) => ({
        showId: item.show_id,
        showDate: item.show_showDate,
        startTime: item.show_startTime,
        movieTitle: item.movieTitle,
        screenName: item.screenName,
        totalBookings: parseInt(item.totalBookings),
        totalRevenue: parseFloat(item.totalRevenue),
      })),
    };
  }

  async getCancellationRate(theaterOwnerId: string, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    
    const totalBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.show', 'show')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('DATE(booking.createdAt) = :date', { date: queryDate })
      .getCount();

    const cancelledBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .innerJoin('booking.show', 'show')
      .innerJoin('show.screen', 'screen')
      .innerJoin('screen.theaterOwner', 'theaterOwner')
      .where('theaterOwner.id = :theaterOwnerId', { theaterOwnerId })
      .andWhere('booking.status = :status', { status: 'CANCELLED' })
      .andWhere('DATE(booking.createdAt) = :date', { date: queryDate })
      .getCount();

    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    return {
      date: queryDate,
      totalBookings,
      cancelledBookings,
      cancellationRate: parseFloat(cancellationRate.toFixed(2)),
    };
  }

  async getOverallAnalytics(theaterOwnerId: string, date?: string): Promise<any> {
    const queryDate = date || new Date().toISOString().split('T')[0];

    const [dailyRevenue, occupancyRate, topMovies, topShows, cancellationRate] = await Promise.all([
      this.getDailyRevenue(theaterOwnerId, queryDate),
      this.getOccupancyRate(theaterOwnerId, queryDate),
      this.getTopMovies(theaterOwnerId, 5, queryDate),
      this.getTopShows(theaterOwnerId, 5, queryDate),
      this.getCancellationRate(theaterOwnerId, queryDate),
    ]);

    return {
      date: queryDate,
      dailyRevenue,
      occupancyRate,
      topMovies,
      topShows,
      cancellationRate,
    };
  }
}
