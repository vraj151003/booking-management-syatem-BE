import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsDateString } from "class-validator";

export enum ExportFilterType {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM',
}

export class ExportBookingsDto {
  @ApiProperty({ enum: ExportFilterType, required: false })
  @IsOptional()
  @IsEnum(ExportFilterType)
  filterType?: ExportFilterType;

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
  @IsString()
  movieId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  screenId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentStatus?: string;
}
