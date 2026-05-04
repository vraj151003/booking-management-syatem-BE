import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../booking/entity/booking.entity';
import { User } from '../../users/entity/user.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, (booking) => booking.payments)
  booking: Booking;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number; // Ticket price before GST

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gstRate: number; // GST percentage (12 or 18)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  gstAmount: number; // Calculated GST amount

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // Final amount including GST

  @Column()
  currency: string;

  @Column()
  paymentIntentId: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  method: string; // card, upi, etc.

  @Column({ type: 'varchar', nullable: true })
  transactionId: string | null;

  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}