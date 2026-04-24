import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}