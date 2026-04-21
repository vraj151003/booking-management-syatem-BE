import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'The name of the role (e.g., ADMIN, MANAGER, CUSTOMER)',
  })
  name: string;
}
