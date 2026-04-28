import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReviewableType {
  MOVIE = 'MOVIE',
  THEATER = 'THEATER',
}

@Entity('reviews')
@Index(['userId', 'reviewableType', 'reviewableId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ReviewableType,
  })
  reviewableType: ReviewableType;

  @Column()
  reviewableId: string;

  @Column({ type: 'float' })
  rating: number;

  @Column('text')
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
