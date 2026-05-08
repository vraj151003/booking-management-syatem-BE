import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(private configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER') || '';
  }

  async sendSms(to: string, message: string): Promise<void> {
    try {
      // Check if Twilio credentials are configured
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        this.logger.warn('Twilio credentials not configured. Skipping SMS send.');
        return;
      }

      // Check if trying to send to same number (not allowed by Twilio)
      if (to === this.fromNumber) {
        throw new Error('Cannot send SMS to the same number as the sender number');
      }

      // Auto-format Indian mobile numbers (add +91 prefix if missing)
      let formattedNumber = to;
      if (!to.startsWith('+')) {
        // If it's a 10-digit Indian number, add +91 prefix
        if (to.length === 10 && /^[6-9]\d{9}$/.test(to)) {
          formattedNumber = `+91${to}`;
        }
        // If it starts with 0, remove 0 and add +91
        else if (to.length === 11 && to.startsWith('0') && /^[0][6-9]\d{9}$/.test(to)) {
          formattedNumber = `+91${to.substring(1)}`;
        }
        // If it starts with 91 but no +, add +
        else if (to.length === 11 && to.startsWith('91') && /^[91][6-9]\d{9}$/.test(to)) {
          formattedNumber = `+${to}`;
        }
        // If it starts with 91 and has +, keep as is
        else if (to.startsWith('+91') && to.length === 13) {
          formattedNumber = to;
        }
        // Otherwise, try with + prefix
        else {
          formattedNumber = `+${to}`;
        }
      }

      // Import Twilio dynamically to avoid issues if not installed
      const twilio = require('twilio');
      const client = twilio(this.accountSid, this.authToken);

      await client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
      });

      this.logger.log(`SMS sent successfully to ${to} (formatted as ${formattedNumber})`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      
      // Provide more specific error messages
      if (error.code === 21266) {
        throw new Error('Cannot send SMS to the same number as the Twilio sender number');
      } else if (error.code === 21614) {
        throw new Error('Mobile number is not a valid number or not reachable');
      } else if (error.code === 21610) {
        throw new Error('Mobile number is not verified for trial accounts');
      } else if (error.code === 21659) {
        throw new Error('Twilio sender number is not valid or not configured properly. Please check your TWILIO_FROM_NUMBER environment variable.');
      } else if (error.code === 21612) {
        throw new Error('Twilio account is not configured for SMS. Please check your Twilio account settings.');
      } else {
        throw new Error(`SMS sending failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async sendOtpSms(mobileNumber: string, otp: string): Promise<void> {
    const message = `Your OTP for password reset is: ${otp}. It will expire in 10 minutes. Please do not share this OTP with anyone.`;
    
    await this.sendSms(mobileNumber, message);
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }
}
