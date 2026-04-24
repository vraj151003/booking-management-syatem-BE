import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateShowDto {
  @ApiProperty()
  @IsString()
  movieId: string;

  @ApiProperty()
  @IsString()
  screenId: string;

  @ApiProperty()
  @IsDateString()
  showDate: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

  @ApiProperty({
    example: {
      GOLD: 300,
      SILVER: 200,
      PLATINUM: 500,
    },
  })
  @IsObject()
  pricing: Record<string, number>;
}