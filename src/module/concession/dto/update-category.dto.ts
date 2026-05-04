import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Beverages', description: 'Category name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Soft drinks and juices', description: 'Category description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
