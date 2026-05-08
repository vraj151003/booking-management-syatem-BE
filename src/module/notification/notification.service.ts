import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { FirebaseService } from '../firebase/firebase.service';

export interface BookingNotificationData {
  customerName: string;
  customerEmail: string;
  theaterOwnerEmail: string;
  movieName: string;
  showDate: string;
  showTime: string;
  screenName: string;
  seats: string[];
  totalAmount: number;
  bookingId: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly mailService: MailService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendBookingConfirmationToCustomer(data: BookingNotificationData, userId?: string) {
    const seatsList = data.seats.join(', ');
    
    // Send email notification
    await this.mailService.sendMail({
      to: data.customerEmail,
      subject: 'Booking Confirmed - Your Movie Ticket',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎬 Booking Confirmed!</h2>
          <p>Dear ${data.customerName},</p>
          <p>Your booking has been successfully confirmed. Here are your booking details:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Movie:</strong> ${data.movieName}</p>
            <p><strong>Date:</strong> ${data.showDate}</p>
            <p><strong>Time:</strong> ${data.showTime}</p>
            <p><strong>Screen:</strong> ${data.screenName}</p>
            <p><strong>Seats:</strong> ${seatsList}</p>
            <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
          </div>
          
          <p>Please arrive at the theater 30 minutes before the show time.</p>
          <p>Thank you for booking with us!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    });

    // Send push notification if userId is provided
    if (userId) {
      await this.firebaseService.sendBookingConfirmationToCustomer(userId, {
        bookingId: data.bookingId,
        movieName: data.movieName,
        showDate: data.showDate,
        showTime: data.showTime,
        screenName: data.screenName,
        seats: data.seats,
        totalAmount: data.totalAmount,
      });
    }
  }

  async sendBookingNotificationToTheaterOwner(data: BookingNotificationData, theaterOwnerUserId?: string) {
    const seatsList = data.seats.join(', ');
    
    // Send email notification
    await this.mailService.sendMail({
      to: data.theaterOwnerEmail,
      subject: `New Booking - ${data.movieName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Booking Received</h2>
          <p>A new booking has been made for your theater. Here are the details:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Customer Name:</strong> ${data.customerName}</p>
            <p><strong>Customer Email:</strong> ${data.customerEmail}</p>
            <p><strong>Movie:</strong> ${data.movieName}</p>
            <p><strong>Date:</strong> ${data.showDate}</p>
            <p><strong>Time:</strong> ${data.showTime}</p>
            <p><strong>Screen:</strong> ${data.screenName}</p>
            <p><strong>Seats:</strong> ${seatsList}</p>
            <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
          </div>
          
          <p>Please ensure the screen is ready for the show.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    });

    // Send push notification if theaterOwnerUserId is provided
    if (theaterOwnerUserId) {
      await this.firebaseService.sendBookingNotificationToTheaterOwner(theaterOwnerUserId, {
        bookingId: data.bookingId,
        movieName: data.movieName,
        showDate: data.showDate,
        showTime: data.showTime,
        screenName: data.screenName,
        seats: data.seats,
        totalAmount: data.totalAmount,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
      });
    }
  }

  async sendBookingNotifications(data: BookingNotificationData, customerUserId?: string, theaterOwnerUserId?: string) {
    await Promise.all([
      this.sendBookingConfirmationToCustomer(data, customerUserId),
      this.sendBookingNotificationToTheaterOwner(data, theaterOwnerUserId),
    ]);
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
  ) {
    // Send email notification
    await this.mailService.sendMail({
      to: 'admin@movieticket.com', // Or get user email if needed
      subject: `Payment ${paymentData.status === 'success' ? 'Success' : 'Failed'} - ${paymentData.paymentId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${paymentData.status === 'success' ? '#28a745' : '#dc3545'};">
            ${paymentData.status === 'success' ? '✅ Payment Successful' : '❌ Payment Failed'}
          </h2>
          <p>Payment details:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Payment ID:</strong> ${paymentData.paymentId}</p>
            <p><strong>Amount:</strong> ₹${paymentData.amount}</p>
            <p><strong>Status:</strong> ${paymentData.status}</p>
            ${paymentData.movieName ? `<p><strong>Movie:</strong> ${paymentData.movieName}</p>` : ''}
            ${paymentData.bookingId ? `<p><strong>Booking ID:</strong> ${paymentData.bookingId}</p>` : ''}
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This is an automated notification.</p>
        </div>
      `,
    });

    // Send push notification
    await this.firebaseService.sendPaymentNotification(userId, paymentData);
  }
}
