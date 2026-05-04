import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ConcessionOrder } from './concession-order.entity';
import { Concession } from './concession.entity';

@Entity('concession_order_items')
export class ConcessionOrderItem {
  @ApiProperty({ example: 1, description: 'Order item ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ConcessionOrder, order => order.orderItems)
  concessionOrder: ConcessionOrder;

  @ManyToOne(() => Concession)
  concession: Concession;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  @Column({ default: 1 })
  quantity: number;

  @ApiProperty({ example: 8.99, description: 'Price per item at time of order' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 17.98, description: 'Total price for this item (quantity * unit price)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ example: 'Extra butter', description: 'Customization notes for this item' })
  @Column({ nullable: true })
  customization: string;

  @ApiProperty({ example: false, description: 'Whether item is prepared' })
  @Column({ default: false })
  isPrepared: boolean;

  @ApiProperty({ example: false, description: 'Whether item is picked up' })
  @Column({ default: false })
  isPickedUp: boolean;
}
