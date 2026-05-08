import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, ValidateIf, IsOptional, IsMobilePhone } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsOptional()
  @ValidateIf(o => !o.mobileNumber)
  @IsNotEmpty({ message: 'Either email or mobile number is required' })
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', description: 'User mobile number with country code' })
  @IsOptional()
  @ValidateIf(o => !o.email)
  @IsNotEmpty({ message: 'Either email or mobile number is required' })
  @IsMobilePhone()
  mobileNumber?: string;
}
