import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean,
  ArrayNotEmpty,
  IsString as IsStringItem,
  IsEnum,
} from 'class-validator';
import { MovieStatus } from '../entity/movie.entity';

export class CreateMovieDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  duration: number;

  @ApiProperty()
  @IsString()
  genre: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  rating: number;

  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsDateString()
  releaseDate: Date;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsStringItem({ each: true })
  poster?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsStringItem({ each: true })
  trailer?: string[];

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ enum: MovieStatus, default: MovieStatus.UPCOMING })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;
}