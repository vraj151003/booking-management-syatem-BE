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

@Entity('casts')
export class Cast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  movieId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  character: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: 0 })
  @Index()
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Movie, movie => movie.casts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movieId' })
  movie: Movie;
}
