import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entity/user.entity';
import { ConcessionCategory } from './concession-category.entity';
import { ConcessionOrderItem } from './concession-order-item.entity';

export enum ConcessionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

@Entity('concessions')
export class Concession {
  @ApiProperty({ example: 1, description: 'Concession ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Popcorn Large', description: 'Concession name' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Fresh buttered popcorn in large size', description: 'Concession description' })
  @Column('text')
  description: string;

  @ApiProperty({ example: 8.99, description: 'Concession price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 150, description: 'Available quantity in stock' })
  @Column({ default: 0 })
  stockQuantity: number;

  @ApiProperty({ example: 10, description: 'Minimum stock level to trigger reorder' })
  @Column({ default: 10 })
  minStockLevel: number;

  @ApiProperty({ enum: ConcessionStatus, description: 'Concession status' })
  @Column({
    type: 'enum',
    enum: ConcessionStatus,
    default: ConcessionStatus.ACTIVE,
  })
  status: ConcessionStatus;

  @ApiProperty({ example: 'https://example.com/popcorn.jpg', description: 'Concession image URL' })
  @Column({ nullable: true })
  imageUrl: string;

  @ApiProperty({ example: 15, description: 'Preparation time in minutes' })
  @Column({ default: 5 })
  preparationTime: number; // in minutes

  @ApiProperty({ example: true, description: 'Whether item can be pre-ordered' })
  @Column({ default: true })
  isPreOrderable: boolean;

  @Column({ name: 'theaterOwnerId' })
  theaterOwnerId: string;

  @ManyToOne(() => User)
  theaterOwner: User;

  @Column({ name: 'categoryId', nullable: true })
  categoryId: number;

  @ManyToOne(() => ConcessionCategory, category => category.concessions)
  category: ConcessionCategory;

  @OneToMany(() => ConcessionOrderItem, orderItem => orderItem.concession)
  orderItems: ConcessionOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
