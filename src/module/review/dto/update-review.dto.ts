import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Rating from 1 to 5', required: false })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiProperty({ description: 'Review comment', required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  comment?: string;
}
