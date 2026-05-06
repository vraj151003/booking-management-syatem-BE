import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Show } from '../../show/entity/show.entity';
import { Cast } from './cast.entity';
import { Crew } from './crew.entity';

export enum MovieStatus {
  UPCOMING = 'UPCOMING',
  RUNNING = 'RUNNING',
}

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  name: string;

  @Column('text')
  description: string;

  @Column()
  duration: number;

  @Column()
  @Index()
  genre: string;

  @Column({ type: 'float', default: 0 })
  @Index()
  rating: number;

  @Column()
  @Index()
  language: string;

  @Column({ type: 'date' })
  @Index()
  releaseDate: Date;

  @Column('text', { array: true, nullable: true })
  poster: string[];

  @Column('text', { array: true, nullable: true })
  trailer: string[];

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: MovieStatus,
    default: MovieStatus.UPCOMING,
  })
  @Index()
  status: MovieStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Show, show => show.movie)
  shows: Show[];

  @OneToMany(() => Cast, cast => cast.movie)
  casts: Cast[];

  @OneToMany(() => Crew, crew => crew.movie)
  crews: Crew[];
}