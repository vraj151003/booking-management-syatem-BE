import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { Role } from '../role/entity/role.entity';
import { UserFilterDto } from './dto/user-filter.dto';
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
      where: [
        { email: data.email },
        { mobileNumber: data.mobileNumber },
      ],
    });

    if (existing && existing.id) {
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
      where: [
        { email: data.email },
        { mobileNumber: data.mobileNumber },
      ],
    });

    if (existing && existing.id) {
      throw new BadRequestException('User already exists');
    }

    const role = await this.roleRepo.findOne({
      where: { name: 'THEATRE OWNER' },
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

  async findAllUsers(filters?: UserFilterDto) {
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.mobileNumber) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply role filter
    if (filters?.roleId) {
      queryBuilder.andWhere('user.roleId = :roleId', { roleId: filters.roleId });
    }

    // Apply role name filter
    if (filters?.roleName) {
      queryBuilder.andWhere('role.name = :roleName', { roleName: filters.roleName });
    }

    // Apply role names filter
    if (filters?.roleNames && filters.roleNames.length > 0) {
      queryBuilder.andWhere('role.name IN (:...roleNames)', { roleNames: filters.roleNames });
    }

    // Apply verified status filter
    if (filters?.isVerified !== undefined) {
      queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified: filters.isVerified });
    }

    // Apply active status filter
    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('user.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('user.createdAt <= :endDate', { endDate });
    }

    return {
      message: 'Users retrieved successfully',
      data: await queryBuilder.getMany(),
    };
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
