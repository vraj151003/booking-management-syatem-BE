import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { CrewRole } from '../entity/crew.entity';

export class CreateCrewDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: CrewRole })
  @IsEnum(CrewRole)
  role: CrewRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ default: 0, required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCrewDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: CrewRole, required: false })
  @IsOptional()
  @IsEnum(CrewRole)
  role?: CrewRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}
