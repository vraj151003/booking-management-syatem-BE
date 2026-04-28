import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsUUID, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';
import { ReviewableType } from '../entity/review.entity';

export class CreateReviewDto {
  @ApiProperty({ enum: ReviewableType, description: 'Type of reviewable item' })
  @IsEnum(ReviewableType)
  reviewableType: ReviewableType;

  @ApiProperty({ description: 'ID of the movie or theater' })
  @IsString()
  @IsUUID()
  reviewableId: string;

  @ApiProperty({ description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Review comment' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
