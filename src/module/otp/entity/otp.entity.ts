import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entity/user.entity';

@Entity()
export class Otp {
  @ApiProperty({ example: 1, description: 'OTP ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @Column()
  code: string;

  @ApiProperty({ example: 1, description: 'User ID' })
  @Column()
  userId: string;

  @ApiProperty({ type: User, description: 'User' })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Expiration time' })
  @Column()
  expiresAt: Date;

  @ApiProperty({ example: false, description: 'Whether OTP has been used' })
  @Column({ default: false })
  isUsed: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
