import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { BookingService } from '../../booking/booking.service';
import { PaymentService } from '../../payment/payment.service';

describe('StripeController', () => {
  let controller: StripeController;
  let stripeService: StripeService;
  let bookingService: BookingService;
  let paymentService: PaymentService;

  const mockStripeService = {
    constructEvent: jest.fn(),
  };

  const mockBookingService = {
    confrimBooking: jest.fn(),
    failBooking: jest.fn(),
  };

  const mockPaymentService = {
    markSuccess: jest.fn(),
    markFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    stripeService = module.get<StripeService>(StripeService);
    bookingService = module.get<BookingService>(BookingService);
    paymentService = module.get<PaymentService>(PaymentService);

    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    const mockRequest = {
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }))),
      body: { type: 'payment_intent.succeeded' },
    };

    it('should handle payment_intent.succeeded event', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markSuccess.mockResolvedValue({});
      mockBookingService.confrimBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markSuccess).toHaveBeenCalledWith('pi_123');
      expect(mockBookingService.confrimBooking).toHaveBeenCalledWith('pi_123');
    });

    it('should handle payment_intent.payment_failed event', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markFailed.mockResolvedValue({});
      mockBookingService.failBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markFailed).toHaveBeenCalledWith('pi_123');
      expect(mockBookingService.failBooking).toHaveBeenCalledWith('pi_123');
    });

    it('should handle payment_intent.canceled event', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.canceled',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markFailed.mockResolvedValue({});
      mockBookingService.failBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markFailed).toHaveBeenCalledWith('pi_123');
      expect(mockBookingService.failBooking).toHaveBeenCalledWith('pi_123');
    });

    it('should handle unknown event type', async () => {
      // Arrange
      const mockEvent = {
        type: 'unknown.event',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markSuccess).not.toHaveBeenCalled();
      expect(mockPaymentService.markFailed).not.toHaveBeenCalled();
      expect(mockBookingService.confrimBooking).not.toHaveBeenCalled();
      expect(mockBookingService.failBooking).not.toHaveBeenCalled();
    });

    it('should handle request without arrayBuffer (curl testing)', async () => {
      // Arrange
      const mockRequestWithoutArrayBuffer = {
        body: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } },
      };
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markSuccess.mockResolvedValue({});
      mockBookingService.confrimBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequestWithoutArrayBuffer as any, 'YOUR_STRIPE_WEBHOOK_SIGNATURE');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markSuccess).toHaveBeenCalledWith('pi_123');
      expect(mockBookingService.confrimBooking).toHaveBeenCalledWith('pi_123');
    });

    it('should skip signature verification with placeholder signature', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_123' } },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markSuccess.mockResolvedValue({});
      mockBookingService.confrimBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'YOUR_STRIPE_WEBHOOK_SIGNATURE');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockStripeService.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        'YOUR_STRIPE_WEBHOOK_SIGNATURE',
        true,
      );
    });

    it('should throw error when constructEvent fails', async () => {
      // Arrange
      mockStripeService.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      // Act & Assert
      await expect(controller.handleWebhook(mockRequest as any, 'invalid_sig')).rejects.toThrow(
        'Invalid signature',
      );
    });

    it('should handle payment_intent.succeeded with complex payload', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
            amount: 50000,
            currency: 'inr',
            metadata: { bookingId: 'booking-123' },
          },
        },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markSuccess.mockResolvedValue({});
      mockBookingService.confrimBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markSuccess).toHaveBeenCalledWith('pi_123');
    });

    it('should handle payment_intent.payment_failed with failure reason', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_123',
            last_payment_error: { message: 'Insufficient funds' },
          },
        },
      };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);
      mockPaymentService.markFailed.mockResolvedValue({});
      mockBookingService.failBooking.mockResolvedValue({});

      // Act
      const result = await controller.handleWebhook(mockRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
      expect(mockPaymentService.markFailed).toHaveBeenCalledWith('pi_123');
    });

    it('should handle empty request body with arrayBuffer', async () => {
      // Arrange
      const mockEmptyRequest = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('{}')),
        body: {},
      };
      const mockEvent = { type: 'unknown.event', data: {} };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = await controller.handleWebhook(mockEmptyRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
    });

    it('should handle null request body with arrayBuffer', async () => {
      // Arrange
      const mockNullRequest = {
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('null')),
        body: null,
      };
      const mockEvent = { type: 'unknown.event', data: null };
      mockStripeService.constructEvent.mockReturnValue(mockEvent);

      // Act
      const result = await controller.handleWebhook(mockNullRequest as any, 'sig_123');

      // Assert
      expect(result).toEqual({ received: true });
    });
  });
});
