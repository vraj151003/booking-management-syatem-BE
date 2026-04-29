import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Show } from '../../show/entity/show.entity';

export enum MovieStatus {
  UPCOMING = 'UPCOMING',
  RUNNING = 'RUNNING',
}

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  duration: number; 

  @Column()
  genre: string;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column()
  language: string;

  @Column({ type: 'date' })
  releaseDate: Date;

  @Column('text', { array: true, nullable: true })
  poster: string[];

  @Column('text', { array: true, nullable: true })
  trailer: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: MovieStatus,
    default: MovieStatus.UPCOMING,
  })
  status: MovieStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Show, show => show.movie)
  shows: Show[];
}