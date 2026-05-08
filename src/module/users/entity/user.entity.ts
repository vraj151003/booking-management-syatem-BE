import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../role/entity/role.entity';
import { DeviceToken } from '../../firebase/entity/device-token.entity';

@Entity()
export class User {
  @ApiProperty({ example: 1, description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @Column()
  firstName: string;

   @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  @Column()
  lastName: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: '1234567890', description: 'Mobile number' })
  @Column({ unique: true })
  mobileNumber: string;

  @ApiProperty({ description: 'Hashed password (not exposed in API responses)' })
  @Column()
  password: string;

  @ApiProperty({ type: Role, description: 'User role' })
  @ManyToOne(() => Role)
  role: Role;

  @ApiProperty({ example: 'Male', description: 'Gender', required: false })
  @Column({ nullable: true })
  gender: string;

  @ApiProperty({ example: '1990-01-01', description: 'Date of birth', required: false })
  @Column({ nullable: true })
  dateOfBirth: string;

  @ApiProperty({ example: 'profile.jpg', description: 'Profile image URL', required: false })
  @Column({ nullable: true })
  profile: string;

  @ApiProperty({ example: 'Grand Cinema', description: 'Theater name', required: false })
  @Column({ nullable: true })
  theatreName: string;

  @ApiProperty({ example: 'Multiplex', description: 'Business type', required: false })
  @Column({ nullable: true })
  businessType: string;

  @ApiProperty({ example: '29AAAAA0000A1Z5', description: 'GST number', required: false })
  @Column({ nullable: true })
  gstNumber: string;

  @ApiProperty({ example: 'ABCDE1234F', description: 'PAN number', required: false })
  @Column({ nullable: true })
  panNumber: string;

  @ApiProperty({ example: '123 Main Street', description: 'Address', required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ example: 'Mumbai', description: 'City', required: false })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ example: 'Maharashtra', description: 'State', required: false })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: '400001', description: 'Pincode', required: false })
  @Column({ nullable: true })
  pincode: string;

  @ApiProperty({ example: 'State Bank of India', description: 'Bank name', required: false })
  @Column({ nullable: true })
  bankName: string;

  @ApiProperty({ example: '1234567890', description: 'Account number', required: false })
  @Column({ nullable: true })
  accountNumber: string;

  @ApiProperty({ example: 'SBIN0001234', description: 'IFSC code', required: false })
  @Column({ nullable: true })
  ifscCode: string;

  @ApiProperty({ example: 'John Doe', description: 'Account holder name', required: false })
  @Column({ nullable: true })
  accountHolderName: string;

  @ApiProperty({ example: 'aadhar.pdf', description: 'ID proof document URL', required: false })
  @Column({ nullable: true })
  idProof: string;

  @ApiProperty({ example: 'agreement.pdf', description: 'Agreement document URL', required: false })
  @Column({ nullable: true })
  agreementDoc: string;

  @ApiProperty({ example: false, description: 'Email verification status' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ example: false, description: 'Admin verification status', required: false })
  @Column({ default: false })
  adminVerified: boolean;

  @ApiProperty({ example: 0, description: 'Number of failed login attempts', default: 0 })
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @ApiProperty({ example: null, description: 'Account locked until timestamp', nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @OneToMany(() => DeviceToken, deviceToken => deviceToken.user, { cascade: true })
  deviceTokens: DeviceToken[];
}