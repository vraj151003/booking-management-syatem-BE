import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ConcessionStatus } from '../entity/concession.entity';

export class CreateConcessionDto {
  @ApiProperty({ example: 'Popcorn Large', description: 'Concession name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Fresh buttered popcorn in large size', description: 'Concession description' })
  @IsString()
  description: string;

  @ApiProperty({ example: 8.99, description: 'Concession price' })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 150, description: 'Available quantity in stock' })
  @IsNumber()
  stockQuantity: number;

  @ApiProperty({ example: 10, description: 'Minimum stock level to trigger reorder' })
  @IsOptional()
  @IsNumber()
  minStockLevel?: number;

  @ApiProperty({ enum: ConcessionStatus, description: 'Concession status' })
  @IsOptional()
  @IsEnum(ConcessionStatus)
  status?: ConcessionStatus;

  @ApiProperty({ example: 'https://example.com/popcorn.jpg', description: 'Concession image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 15, description: 'Preparation time in minutes' })
  @IsOptional()
  @IsNumber()
  preparationTime?: number;

  @ApiProperty({ example: true, description: 'Whether item can be pre-ordered' })
  @IsOptional()
  isPreOrderable?: boolean;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 'user-123', description: 'Theater owner ID' })
  @IsString()
  theaterOwnerId: string;
}
