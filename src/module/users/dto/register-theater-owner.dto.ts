import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { RegisterUserDto } from './register-user.dto';

export class RegisterTheaterOwnerDto extends RegisterUserDto {
  @ApiProperty({ example: 'Grand Cinema', description: 'Theater name' })
  @IsNotEmpty()
  @IsString()
  theatreName: string;

  @ApiProperty({ example: 'Multiplex', description: 'Business type' })
  @IsNotEmpty()
  @IsString()
  businessType: string;

  @ApiProperty({ example: '29AAAAA0000A1Z5', description: 'GST number', required: false })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiProperty({ example: 'ABCDE1234F', description: 'PAN number', required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ example: '123 Main Street', description: 'Address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Mumbai', description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Maharashtra', description: 'State', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '400001', description: 'Pincode', required: false })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ example: 'State Bank of India', description: 'Bank name', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ example: '1234567890', description: 'Account number', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ example: 'SBIN0001234', description: 'IFSC code', required: false })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiProperty({ example: 'John Doe', description: 'Account holder name', required: false })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiProperty({ example: 'aadhar.pdf', description: 'ID proof document', required: false })
  @IsOptional()
  @IsString()
  idProof?: string;

  @ApiProperty({ example: 'agreement.pdf', description: 'Agreement document', required: false })
  @IsOptional()
  @IsString()
  agreementDoc?: string;
}
