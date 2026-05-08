import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  deviceType: 'ios' | 'android';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private fcm: admin.messaging.Messaging;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccount = {
        projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
        clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
        privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      };

      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        this.logger.warn('Firebase credentials not configured. Push notifications will be disabled.');
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

      this.fcm = admin.messaging();
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  async sendPushNotification(
    deviceTokens: string[],
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    if (!this.fcm) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return { success: 0, failed: deviceTokens.length, errors: [] };
    }

    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      tokens: deviceTokens,
    };

    try {
      const response = await this.fcm.sendEachForMulticast(message);
      
      const successCount = response.successCount || 0;
      const failureCount = response.failureCount || 0;
      const errors = response.responses
        .filter(res => !res.success)
        .map(res => res.error);

      this.logger.log(`Push notification sent: ${successCount} success, ${failureCount} failed`);
      
      return {
        success: successCount,
        failed: failureCount,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      return { success: 0, failed: deviceTokens.length, errors: [error] };
    }
  }

  async sendPushNotificationToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const user = await this.userRepo.findOne({ 
      where: { id: userId },
      relations: ['deviceTokens'] 
    });

    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return { success: 0, failed: 0, errors: [] };
    }

    const activeTokens = user.deviceTokens
      .filter(token => token.isActive)
      .map(token => token.token);

    if (activeTokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return { success: 0, failed: 0, errors: [] };
    }

    return this.sendPushNotification(activeTokens, payload);
  }

  async sendBookingConfirmationToCustomer(
    userId: string,
    bookingData: {
      bookingId: string;
      movieName: string;
      showDate: string;
      showTime: string;
      screenName: string;
      seats: string[];
      totalAmount: number;
    },
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🎬 Booking Confirmed!',
      body: `Your booking for ${bookingData.movieName} is confirmed. ${bookingData.seats.length} seat(s) booked for ${bookingData.showDate} at ${bookingData.showTime}.`,
      data: {
        type: 'booking_confirmed',
        bookingId: bookingData.bookingId,
        movieName: bookingData.movieName,
        showDate: bookingData.showDate,
        showTime: bookingData.showTime,
        screenName: bookingData.screenName,
        seats: JSON.stringify(bookingData.seats),
        totalAmount: bookingData.totalAmount.toString(),
      },
    };

    await this.sendPushNotificationToUser(userId, payload);
  }

  async sendBookingNotificationToTheaterOwner(
    theaterOwnerUserId: string,
    bookingData: {
      bookingId: string;
      movieName: string;
      showDate: string;
      showTime: string;
      screenName: string;
      seats: string[];
      totalAmount: number;
      customerName: string;
      customerEmail: string;
    },
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: '🎟 New Booking Received',
      body: `${bookingData.customerName} booked ${bookingData.seats.length} seat(s) for ${bookingData.movieName} on ${bookingData.showDate} at ${bookingData.showTime}.`,
      data: {
        type: 'new_booking',
        bookingId: bookingData.bookingId,
        movieName: bookingData.movieName,
        showDate: bookingData.showDate,
        showTime: bookingData.showTime,
        screenName: bookingData.screenName,
        seats: JSON.stringify(bookingData.seats),
        totalAmount: bookingData.totalAmount.toString(),
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail,
      },
    };

    await this.sendPushNotificationToUser(theaterOwnerUserId, payload);
  }

  async sendPaymentNotification(
    userId: string,
    paymentData: {
      paymentId: string;
      amount: number;
      status: 'success' | 'failed';
      movieName?: string;
      bookingId?: string;
    },
  ): Promise<void> {
    const isSuccess = paymentData.status === 'success';
    const title = isSuccess ? '💳 Payment Successful' : '❌ Payment Failed';
    const body = isSuccess 
      ? `Payment of ₹${paymentData.amount} processed successfully${paymentData.movieName ? ` for ${paymentData.movieName}` : ''}.`
      : `Payment of ₹${paymentData.amount} failed${paymentData.movieName ? ` for ${paymentData.movieName}` : ''}. Please try again.`;

    const payload: PushNotificationPayload = {
      title,
      body,
      data: {
        type: 'payment_status',
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        amount: paymentData.amount.toString(),
        movieName: paymentData.movieName || '',
        bookingId: paymentData.bookingId || '',
      },
    };

    await this.sendPushNotificationToUser(userId, payload);
  }

  isConfigured(): boolean {
    return !!this.fcm;
  }
}
