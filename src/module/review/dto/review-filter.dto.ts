import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsEnum, IsArray } from 'class-validator';
import { ReviewableType } from '../entity/review.entity';

export class ReviewFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ReviewableType)
  reviewableType?: ReviewableType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reviewableId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];
}
