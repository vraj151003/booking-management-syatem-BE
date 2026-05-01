import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ example: '2024-12-25' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Christmas Day' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
