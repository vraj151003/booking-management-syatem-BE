import { Payment } from '../../payment/entity/payment.entity';
import { Seat } from '../../seat/entity/seat.entity';
import { Show } from '../../show/entity/show.entity';
import { User } from '../../users/entity/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinTable,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Show)
  show: Show;

  @ManyToMany(() => Seat)
  @JoinTable()
  seats: Seat[];

  @Column()
  totalAmount: number;

  @Column({ default: 'PENDING' })
  status: string;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ default: 'PENDING' })
  paymentStatus: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  couponId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @CreateDateColumn()
  createdAt: Date;
}
