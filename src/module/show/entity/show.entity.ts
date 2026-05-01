import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Movie } from '../../movie/entity/movie.entity';
import { Screen } from '../../screen/entity/screen.entity';
import { Booking } from '../../booking/entity/booking.entity';

@Entity('shows')
export class Show {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Movie)
  movie: Movie;

  @ManyToOne(() => Screen)
  screen: Screen;

  @Column({ type: 'date' })
  @Index()
  showDate: string;

  @Column()
  @Index()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ type: 'json' })
  pricing: Record<string, number>;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @OneToMany(() => Booking, booking => booking.show)
  bookings: Booking[];
}