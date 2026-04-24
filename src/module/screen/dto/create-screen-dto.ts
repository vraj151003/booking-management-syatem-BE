import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';


class RowConfig {
  @ApiProperty()
  @IsString()
  row: string; 

  @ApiProperty()
  seats: number;

  @ApiProperty({ example: 'GOLD' })
  type: string;
}

export class CreateScreenDTO {
  @ApiProperty()
  @IsString()
  name: string;

   @ApiProperty({ type: [RowConfig] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RowConfig)
  layout: RowConfig[];

  @ApiProperty()
  @IsString()
  ownerId: string;
}
