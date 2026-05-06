import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Movie } from './movie.entity';

export enum CrewRole {
  DIRECTOR = 'DIRECTOR',
  WRITER = 'WRITER',
  MUSIC_DIRECTOR = 'MUSIC_DIRECTOR',
  SCREENPLAY = 'SCREENPLAY',
  PRODUCER = 'PRODUCER',
  CINEMATOGRAPHER = 'CINEMATOGRAPHER',
  EDITOR = 'EDITOR',
}

@Entity('crews')
export class Crew {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  movieId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CrewRole,
  })
  @Index()
  role: CrewRole;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0 })
  @Index()
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Movie, movie => movie.crews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movieId' })
  movie: Movie;
}
