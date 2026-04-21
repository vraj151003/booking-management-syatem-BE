import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp } from './entity/otp.entity';
import { User } from '../users/entity/user.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
  ) {}

  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(user: User): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otpRecord = this.otpRepo.create({
      code: otp,
      userId: user.id,
      user,
      expiresAt,
    });

    await this.otpRepo.save(otpRecord);
    return otp;
  }

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const otpRecord = await this.otpRepo.findOne({
      where: { userId, code: otp, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    otpRecord.isUsed = true;
    await this.otpRepo.save(otpRecord);

    return true;
  }
}
