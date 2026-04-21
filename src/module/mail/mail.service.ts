import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('database.mail_host') || 'smtp.gmail.com',
      port: this.configService.get<number>('database.mail_port') || 587,
      secure: this.configService.get<boolean>('database.mail_secure') || false,
      auth: {
        user: this.configService.get<string>('database.email') || this.configService.get<string>('database.mail_user'),
        pass: this.configService.get<string>('database.email_password') || this.configService.get<string>('database.mail_password'),
      },
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    await this.transporter.sendMail({
      from: this.configService.get<string>('database.mail_from') || '"Movie Booking" <noreply@example.com>',
      to,
      subject: 'Your OTP Verification Code',
      html: `
        <h2>OTP Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });
  }
}