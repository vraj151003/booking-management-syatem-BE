import { ApiProperty } from '@nestjs/swagger';
import { ReviewableType } from '../entity/review.entity';

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ReviewableType })
  reviewableType: ReviewableType;

  @ApiProperty()
  reviewableId: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
