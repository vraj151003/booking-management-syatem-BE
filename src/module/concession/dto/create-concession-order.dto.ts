import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';
import { PickupTime } from '../entity/concession-order.entity';

export class ConcessionOrderItemDto {
  @ApiProperty({ example: 1, description: 'Concession ID' })
  @IsNumber()
  concessionId: number;

  @ApiProperty({ example: 2, description: 'Quantity ordered' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'Extra butter', description: 'Customization notes for this item' })
  @IsOptional()
  @IsString()
  customization?: string;
}

export class CreateConcessionOrderDto {
  @ApiProperty({ example: 'booking-123', description: 'Booking ID' })
  @IsString()
  bookingId: string;

  @ApiProperty({ example: 'user-123', description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ type: [ConcessionOrderItemDto], description: 'Order items' })
  @IsArray()
  items: ConcessionOrderItemDto[];

  @ApiProperty({ enum: PickupTime, description: 'Preferred pickup time' })
  @IsOptional()
  @IsEnum(PickupTime)
  pickupTime?: PickupTime;

  @ApiProperty({ example: '2024-05-04T19:30:00Z', description: 'Show start time for pickup calculation' })
  @IsOptional()
  showStartTime?: Date;

  @ApiProperty({ example: 'No extra salt', description: 'Special instructions for order' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
