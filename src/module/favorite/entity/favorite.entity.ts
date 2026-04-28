import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FavoritableType {
  MOVIE = 'MOVIE',
  THEATER = 'THEATER',
}

@Entity('favorites')
@Index(['userId', 'favoritableType', 'favoritableId'], { unique: true })
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: FavoritableType,
  })
  favoritableType: FavoritableType;

  @Column()
  favoritableId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
