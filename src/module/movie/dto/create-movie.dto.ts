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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovieStatus } from '../entity/movie.entity';
import { CreateCastDto } from './cast.dto';
import { CreateCrewDto } from './crew.dto';

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

  @ApiProperty({ type: [CreateCastDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCastDto)
  casts?: CreateCastDto[];

  @ApiProperty({ type: [CreateCrewDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCrewDto)
  crews?: CreateCrewDto[];
}