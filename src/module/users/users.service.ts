import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../role/entity/role.entity';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly mailService: MailService,

    private readonly otpService: OtpService,
  ) {}

  async registerUser(data: any) {
    const existing = await this.userRepo.findOne({
      where: [{ email: data.email }, { mobileNumber: data.mobileNumber }],
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const role = await this.roleRepo.findOne({
      where: { name: 'CUSTOMER' },
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepo.save(user);
    const userEntity = Array.isArray(savedUser) ? savedUser[0] : savedUser;

    if (!userEntity || !userEntity.id) {
      throw new BadRequestException('Failed to create user - ID not generated');
    }

    const otp = await this.otpService.createOtp(userEntity);

    await this.mailService.sendOtpEmail(data.email, otp);

    return userEntity;
  }

  async registerTheaterOwner(data: any) {
    const existing = await this.userRepo.findOne({
      where: [{ email: data.email }, { mobileNumber: data.mobileNumber }],
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const role = await this.roleRepo.findOne({
      where: { name: 'THEATER_OWNER' },
    });

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepo.create({
      ...data,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepo.save(user);
    const userEntity = Array.isArray(savedUser) ? savedUser[0] : savedUser;

    if (!userEntity || !userEntity.id) {
      throw new BadRequestException('Failed to create user - ID not generated');
    }

    const otp = await this.otpService.createOtp(userEntity);

    await this.mailService.sendOtpEmail(data.email, otp);

    return userEntity;
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found');

    await this.otpService.verifyOtp(user.id, otp);

    user.isVerified = true;

    return this.userRepo.save(user);
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpService.createOtp(user);
    await this.mailService.sendOtpEmail(email, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) throw new NotFoundException('User not found');
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    await this.otpService.verifyOtp(user.id, otp);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepo.save(user);
    return {
      message: 'Password reset successfully',
    };
  }
}
