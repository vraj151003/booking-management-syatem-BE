import { Payment } from '../../payment/entity/payment.entity';
import { Seat } from '../../seat/entity/seat.entity';
import { Show } from '../../show/entity/show.entity';
import { User } from '../../users/entity/user.entity';
import { ConcessionOrder } from '../../concession/entity/concession-order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  JoinTable,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  Index,
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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'PENDING' })
  @Index()
  status: string;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments: Payment[];

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ default: 'PENDING' })
  @Index()
  paymentStatus: string;

  @Column({ default: false })
  @Index()
  isUsed: boolean;

  @Column({ nullable: true })
  @Index()
  couponId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  @OneToMany(() => ConcessionOrder, concessionOrder => concessionOrder.booking)
  concessionOrders: ConcessionOrder[];

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
