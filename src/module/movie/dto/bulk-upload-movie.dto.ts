import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { MovieStatus } from '../entity/movie.entity';

export class BulkUploadMovieDto {
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trailer?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ enum: MovieStatus, default: MovieStatus.UPCOMING })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  casts?: Array<{
    name: string;
    character?: string;
    image?: string;
    order?: number;
  }>;

  @ApiProperty({ type: [Object], required: false })
  @IsOptional()
  @IsArray()
  crews?: Array<{
    name: string;
    role: string;
    image?: string;
    order?: number;
  }>;
}
