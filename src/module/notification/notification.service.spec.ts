import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService, BookingNotificationData } from './notification.service';
import { MailService } from '../mail/mail.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mailService: jest.Mocked<MailService>;

  const mockMailService = { sendMail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: MailService, useValue: mockMailService }],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    mailService = module.get(MailService);
    mockMailService.sendMail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const validData: BookingNotificationData = {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    theaterOwnerEmail: 'owner@example.com',
    movieName: 'Avengers',
    showDate: '2024-05-01',
    showTime: '18:00',
    screenName: 'Screen 1',
    seats: ['A1', 'A2', 'A3'],
    totalAmount: 450,
    bookingId: 'booking-123',
  };

  describe('sendBookingConfirmationToCustomer', () => {
    it('should send email with correct subject and recipient', async () => {
      await service.sendBookingConfirmationToCustomer(validData);
      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: 'john@example.com',
        subject: 'Booking Confirmed - Your Movie Ticket',
        html: expect.any(String),
      });
    });

    it('should include all booking details in email body', async () => {
      await service.sendBookingConfirmationToCustomer(validData);
      const html = mailService.sendMail.mock.calls[0][0].html;
      expect(html).toContain('John Doe');
      expect(html).toContain('booking-123');
      expect(html).toContain('Avengers');
      expect(html).toContain('2024-05-01');
      expect(html).toContain('18:00');
      expect(html).toContain('Screen 1');
      expect(html).toContain('A1, A2, A3');
      expect(html).toContain('₹450');
    });

    it('should handle single seat', async () => {
      const data = { ...validData, seats: ['B5'] };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('B5') }),
      );
    });

    it('should handle empty seats array', async () => {
      const data = { ...validData, seats: [] };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should handle zero amount', async () => {
      const data = { ...validData, totalAmount: 0 };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('₹0') }),
      );
    });

    it('should handle large amount', async () => {
      const data = { ...validData, totalAmount: 999999 };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('₹999999') }),
      );
    });

    it('should handle special characters in name', async () => {
      const data = { ...validData, customerName: "John O'Brien-Müller" };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining("John O'Brien-Müller") }),
      );
    });

    it('should handle empty string fields', async () => {
      const data = { ...validData, customerName: '', movieName: '' };
      await service.sendBookingConfirmationToCustomer(data);
      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should propagate mail service errors', async () => {
      mockMailService.sendMail.mockRejectedValue(new Error('SMTP Error'));
      await expect(service.sendBookingConfirmationToCustomer(validData)).rejects.toThrow('SMTP Error');
    });

    it('should include arrival instruction', async () => {
      await service.sendBookingConfirmationToCustomer(validData);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('30 minutes before') }),
      );
    });
  });

  describe('sendBookingNotificationToTheaterOwner', () => {
    it('should send email with correct subject and recipient', async () => {
      await service.sendBookingNotificationToTheaterOwner(validData);
      expect(mailService.sendMail).toHaveBeenCalledWith({
        to: 'owner@example.com',
        subject: 'New Booking - Avengers',
        html: expect.any(String),
      });
    });

    it('should include all booking details in email body', async () => {
      await service.sendBookingNotificationToTheaterOwner(validData);
      const html = mailService.sendMail.mock.calls[0][0].html;
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('booking-123');
      expect(html).toContain('Avengers');
      expect(html).toContain('2024-05-01');
      expect(html).toContain('18:00');
      expect(html).toContain('Screen 1');
      expect(html).toContain('A1, A2, A3');
      expect(html).toContain('₹450');
    });

    it('should include movie name in subject', async () => {
      await service.sendBookingNotificationToTheaterOwner(validData);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'New Booking - Avengers' }),
      );
    });

    it('should handle single seat', async () => {
      const data = { ...validData, seats: ['B5'] };
      await service.sendBookingNotificationToTheaterOwner(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('B5') }),
      );
    });

    it('should handle empty seats array', async () => {
      const data = { ...validData, seats: [] };
      await service.sendBookingNotificationToTheaterOwner(data);
      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should handle zero amount', async () => {
      const data = { ...validData, totalAmount: 0 };
      await service.sendBookingNotificationToTheaterOwner(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('₹0') }),
      );
    });

    it('should handle special characters in name', async () => {
      const data = { ...validData, customerName: "John O'Brien-Müller" };
      await service.sendBookingNotificationToTheaterOwner(data);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining("John O'Brien-Müller") }),
      );
    });

    it('should propagate mail service errors', async () => {
      mockMailService.sendMail.mockRejectedValue(new Error('SMTP Error'));
      await expect(service.sendBookingNotificationToTheaterOwner(validData)).rejects.toThrow('SMTP Error');
    });

    it('should include screen preparation instruction', async () => {
      await service.sendBookingNotificationToTheaterOwner(validData);
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: expect.stringContaining('screen is ready') }),
      );
    });
  });

  describe('sendBookingNotifications', () => {
    it('should send both notifications in parallel', async () => {
      mockMailService.sendMail.mockResolvedValue(undefined);
      await service.sendBookingNotifications(validData);
      expect(mailService.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should send to both customer and theater owner', async () => {
      mockMailService.sendMail.mockResolvedValue(undefined);
      await service.sendBookingNotifications(validData);
      const recipients = mailService.sendMail.mock.calls.map((call) => call[0].to);
      expect(recipients).toContain('john@example.com');
      expect(recipients).toContain('owner@example.com');
    });

    it('should fail if customer email fails', async () => {
      mockMailService.sendMail.mockRejectedValueOnce(new Error('Customer email failed'));
      await expect(service.sendBookingNotifications(validData)).rejects.toThrow('Customer email failed');
    });

    it('should fail if theater owner email fails', async () => {
      mockMailService.sendMail.mockResolvedValueOnce(undefined);
      mockMailService.sendMail.mockRejectedValueOnce(new Error('Owner email failed'));
      await expect(service.sendBookingNotifications(validData)).rejects.toThrow('Owner email failed');
    });

    it('should handle both emails failing', async () => {
      mockMailService.sendMail.mockRejectedValue(new Error('Both failed'));
      await expect(service.sendBookingNotifications(validData)).rejects.toThrow('Both failed');
    });
  });
});
