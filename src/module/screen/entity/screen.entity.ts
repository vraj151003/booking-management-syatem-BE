import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';

@Entity('screens')
export class Screen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; 

  @Column()
  totalSeats: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  theaterOwner: User;
}