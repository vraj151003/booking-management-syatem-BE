import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({ description: 'Array of permission IDs to assign to role', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}
