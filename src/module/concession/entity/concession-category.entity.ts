import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Concession } from './concession.entity';

@Entity('concession_categories')
export class ConcessionCategory {
  @ApiProperty({ example: 1, description: 'Category ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Snacks', description: 'Category name' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Various snack items like popcorn, nachos', description: 'Category description' })
  @Column('text')
  description: string;

  @ApiProperty({ example: 1, description: 'Display order for categories' })
  @Column({ default: 0 })
  displayOrder: number;

  @ApiProperty({ example: true, description: 'Whether category is active' })
  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Concession, concession => concession.category)
  concessions: Concession[];
}
