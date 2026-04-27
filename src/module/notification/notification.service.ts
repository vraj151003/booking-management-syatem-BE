import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

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
  constructor(private readonly mailService: MailService) {}

  async sendBookingConfirmationToCustomer(data: BookingNotificationData) {
    const seatsList = data.seats.join(', ');
    
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
  }

  async sendBookingNotificationToTheaterOwner(data: BookingNotificationData) {
    const seatsList = data.seats.join(', ');
    
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
  }

  async sendBookingNotifications(data: BookingNotificationData) {
    await Promise.all([
      this.sendBookingConfirmationToCustomer(data),
      this.sendBookingNotificationToTheaterOwner(data),
    ]);
  }
}
