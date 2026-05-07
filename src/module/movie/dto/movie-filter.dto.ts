import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean, IsNumber, IsEnum, IsArray } from 'class-validator';
import { MovieStatus } from '../entity/movie.entity';

export class MovieFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(MovieStatus)
  status?: MovieStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  language?: string;

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
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  castNames?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crewNames?: string[];
}
