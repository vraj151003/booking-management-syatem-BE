import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Beverages', description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Soft drinks and juices', description: 'Category description' })
  @IsString()
  description: string;
}
