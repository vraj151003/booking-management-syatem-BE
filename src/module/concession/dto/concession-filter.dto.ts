import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean, IsNumber, IsEnum, IsArray } from 'class-validator';
import { ConcessionStatus } from '../entity/concession.entity';
import { ConcessionOrderStatus } from '../entity/concession-order.entity';

export class ConcessionFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ConcessionStatus)
  status?: ConcessionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  theaterOwnerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ConcessionOrderFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(ConcessionOrderStatus)
  status?: ConcessionOrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ConcessionCategoryFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
