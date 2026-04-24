import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Movie } from '../../movie/entity/movie.entity';
import { Screen } from '../../screen/entity/screen.entity';

@Entity('shows')
export class Show {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Movie)
  movie: Movie;

  @ManyToOne(() => Screen)
  screen: Screen;

  @Column({ type: 'date' })
  showDate: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ type: 'json' })
  pricing: Record<string, number>;

  @Column({ default: true })
  isActive: boolean;
}