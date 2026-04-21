import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Role } from '../role/entity/role.entity';
import { UserService } from './users.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    MailModule,
    OtpModule,
    AuthModule,
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}