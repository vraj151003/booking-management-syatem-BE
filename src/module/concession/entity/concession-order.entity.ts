import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from '../../booking/entity/booking.entity';
import { User } from '../../users/entity/user.entity';
import { ConcessionOrderItem } from './concession-order-item.entity';

export enum ConcessionOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PickupTime {
  BEFORE_MOVIE = 'BEFORE_MOVIE',
  DURING_INTERMISSION = 'DURING_INTERMISSION',
  AFTER_MOVIE = 'AFTER_MOVIE',
}

@Entity('concession_orders')
export class ConcessionOrder {
  @ApiProperty({ example: 1, description: 'Order ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Booking)
  booking: Booking;

  @ManyToOne(() => User)
  user: User;

  @ApiProperty({ example: 15.99, description: 'Total order amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({ enum: ConcessionOrderStatus, description: 'Order status' })
  @Column({
    type: 'enum',
    enum: ConcessionOrderStatus,
    default: ConcessionOrderStatus.PENDING,
  })
  status: ConcessionOrderStatus;

  @ApiProperty({ enum: PickupTime, description: 'Preferred pickup time' })
  @Column({
    type: 'enum',
    enum: PickupTime,
    nullable: true,
  })
  pickupTime: PickupTime;

  @ApiProperty({ example: '2024-05-04T19:30:00Z', description: 'Show start time for pickup calculation' })
  @Column({ nullable: true })
  showStartTime: Date;

  @ApiProperty({ example: 15, description: 'Estimated preparation time in minutes' })
  @Column({ default: 0 })
  estimatedPreparationTime: number;

  @ApiProperty({ example: 'No extra salt', description: 'Special instructions for order' })
  @Column({ nullable: true })
  specialInstructions: string;

  @ApiProperty({ example: 'CARD123456', description: 'Payment reference' })
  @Column({ nullable: true })
  paymentReference: string;

  @ApiProperty({ example: false, description: 'Whether order is paid' })
  @Column({ default: false })
  isPaid: boolean;

  @OneToMany(() => ConcessionOrderItem, orderItem => orderItem.concessionOrder)
  orderItems: ConcessionOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
