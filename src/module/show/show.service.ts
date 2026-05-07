import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Show } from './entity/show.entity';
import { Repository } from 'typeorm';
import { Movie } from '../movie/entity/movie.entity';
import { Screen } from '../screen/entity/screen.entity';
import { Seat } from '../seat/entity/seat.entity';
import { Booking } from '../booking/entity/booking.entity';
import { CreateShowDto } from './dto/create-show.dto';
import { ShowFilterDto } from './dto/show-filter.dto';
import messages from '../../common/config/message.json';
import { BookingStatus } from '../../common/constant';

@Injectable()
export class ShowService {
  constructor(
    @InjectRepository(Show)
    private readonly showRepo: Repository<Show>,

    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,

    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,

    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,

    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async create(dto: CreateShowDto) {
    const movie = await this.movieRepo.findOne({
      where: { id: dto.movieId },
    });

    if (!movie) throw new NotFoundException(messages.messages.SHOW.MOVIE_NOT_FOUND);

    const screen = await this.screenRepo.findOne({
      where: { id: dto.screenId },
      relations: ['theaterOwner'],
    });

    if (!screen) throw new NotFoundException(messages.messages.SHOW.SCREEN_NOT_FOUND);

    const allowedTypes = ['GOLD', 'SILVER', 'PLATINUM', 'STANDARD'];

    for (const key of Object.keys(dto.pricing)) {
      if (!allowedTypes.includes(key)) {
        throw new BadRequestException(`${messages.messages.SHOW.INVALID_SEAT_TYPE}: ${key}`);
      }
    }

    const show = this.showRepo.create({
      ...dto,
      movie,
      screen,
    });

    return {
      message: messages.messages.SHOW.CREATE,
      data: await this.showRepo.save(show),
    };
  }

  async findAll(filters?: ShowFilterDto) {
    const queryBuilder = this.showRepo
      .createQueryBuilder('show')
      .leftJoinAndSelect('show.movie', 'movie')
      .leftJoinAndSelect('show.screen', 'screen');

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(movie.name) LIKE LOWER(:search) OR LOWER(screen.name) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply movie filter
    if (filters?.movieId) {
      queryBuilder.andWhere('show.movieId = :movieId', { movieId: filters.movieId });
    }

    // Apply screen filter
    if (filters?.screenId) {
      queryBuilder.andWhere('show.screenId = :screenId', { screenId: filters.screenId });
    }

    // Apply theater filter
    if (filters?.theaterId) {
      queryBuilder.andWhere('screen.theaterId = :theaterId', { theaterId: filters.theaterId });
    }

    // Apply active status filter
    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('show.isActive = :isActive', { isActive: filters.isActive });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('show.showDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('show.showDate <= :endDate', { endDate: filters.endDate });
    }

    // Apply time filters
    if (filters?.startTime) {
      queryBuilder.andWhere('show.startTime >= :startTime', { startTime: filters.startTime });
    }

    if (filters?.endTime) {
      queryBuilder.andWhere('show.endTime <= :endTime', { endTime: filters.endTime });
    }

    // Apply price filters (JSON pricing)
    if (filters?.minPrice) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM json_each(show.pricing) WHERE CAST(value AS INTEGER) >= :minPrice)',
        { minPrice: filters.minPrice }
      );
    }

    if (filters?.maxPrice) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM json_each(show.pricing) WHERE CAST(value AS INTEGER) <= :maxPrice)',
        { maxPrice: filters.maxPrice }
      );
    }

    return {
      message: messages.messages.SHOW.GET_ALL,
      data: await queryBuilder.getMany(),
    };
  }

  async findOne(id: string) {
    const show = await this.showRepo.findOne({
      where: { id },
      relations: ['movie', 'screen'],
    });

    if (!show) throw new NotFoundException(messages.messages.SHOW.NOT_FOUND);

    return {
      message: messages.messages.SHOW.GET_BY_ID,
      data: show,
    };
  }

  async delete(id: string) {
    const show = await this.showRepo.findOne({
      where: { id },
    });

    if (!show) throw new NotFoundException(messages.messages.SHOW.NOT_FOUND);

    await this.showRepo.remove(show);

    return {
      message: messages.messages.SHOW.DELETE,
    };
  }

  async getSeatAvailability(showId : string){
    const show = await this.showRepo.findOne({
      where : {id : showId},
      relations : ['screen'],
    })

    if(!show){
      throw new NotFoundException(messages.messages.SHOW.NOT_FOUND);
    }

    const seats = await this.seatRepo.find({
      where : {screen : {id : show.screen.id}}
    })

    const bookedSeats = await this.bookingRepo
    .createQueryBuilder('booking')
    .leftJoin('booking.seats', 'seat')
    .where('booking.showId = :showId', { showId })
    .andWhere('booking.status = :status', {status : BookingStatus.CONFIRMED})
    .select('seat.id')
    .getRawMany()

    const bookedSeatIds = bookedSeats.map(s => s.seat_id)

    return seats.map(seat => ({
      id: seat.id,
      seatNumber: seat.seatNumber,
      type: seat.seatType,
      price: show.pricing[seat.seatType] || 0,
      isBooked: bookedSeatIds.includes(seat.id),
    }));
  }
}
