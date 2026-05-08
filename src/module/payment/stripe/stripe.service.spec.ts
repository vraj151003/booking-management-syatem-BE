import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  } as any;

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('sk_test_123');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with correct amount in paise', async () => {
      // Arrange
      const amount = 500;
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 50000,
        currency: 'inr',
      };
      service['stripe'].paymentIntents = {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
      } as any;

      // Act
      const result = await service.createPaymentIntent(amount);

      // Assert
      expect(result).toEqual(mockPaymentIntent);
      expect(service['stripe'].paymentIntents.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'inr',
        payment_method_types: ['card'],
        metadata: undefined,
      });
    });

    it('should create payment intent with metadata', async () => {
      // Arrange
      const amount = 500;
      const metadata = { type: 'concession', orderId: '1' };
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 50000,
        currency: 'inr',
        metadata,
      };
      service['stripe'].paymentIntents = {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
      } as any;

      // Act
      const result = await service.createPaymentIntent(amount, metadata);

      // Assert
      expect(result).toEqual(mockPaymentIntent);
      expect(service['stripe'].paymentIntents.create).toHaveBeenCalledWith({
        amount: 50000,
        currency: 'inr',
        payment_method_types: ['card'],
        metadata,
      });
    });

    it('should handle zero amount', async () => {
      // Arrange
      const amount = 0;
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 0,
        currency: 'inr',
      };
      service['stripe'].paymentIntents = {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
      } as any;

      // Act
      const result = await service.createPaymentIntent(amount);

      // Assert
      expect(result.amount).toBe(0);
    });

    it('should handle large amount', async () => {
      // Arrange
      const amount = 100000;
      const mockPaymentIntent = {
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 10000000,
        currency: 'inr',
      };
      service['stripe'].paymentIntents = {
        create: jest.fn().mockResolvedValue(mockPaymentIntent),
      } as any;

      // Act
      const result = await service.createPaymentIntent(amount);

      // Assert
      expect(result.amount).toBe(10000000);
    });

    it('should throw error when stripe API fails', async () => {
      // Arrange
      service['stripe'].paymentIntents = {
        create: jest.fn().mockRejectedValue(new Error('Stripe API error')),
      } as any;

      // Act & Assert
      await expect(service.createPaymentIntent(500)).rejects.toThrow(
        'Stripe API error',
      );
    });
  });

  describe('constructEvent', () => {
    beforeEach(() => {
      mockConfigService.get.mockReturnValue('sk_test_123');
      service = new StripeService(mockConfigService);
      // Mock the webhooks constructEvent method
      service['stripe'].webhooks = {
        constructEvent: jest.fn(),
      } as any;
    });

    it('should construct event with signature verification', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('whsec_123');
      const payload = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 'sig_123';
      const mockEvent = { type: 'payment_intent.succeeded' };
      (service['stripe'].webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);

      // Act
      const result = service.constructEvent(payload, signature, false);

      // Assert
      expect(result).toEqual(mockEvent);
      expect(service['stripe'].webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_123',
      );
    });

    it('should skip signature verification when skipVerification is true', () => {
      // Arrange
      const payload = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 'any_signature';

      // Act
      const result = service.constructEvent(payload, signature, true);

      // Assert
      expect(result).toEqual({ type: 'payment_intent.succeeded' });
      expect(service['stripe'].webhooks.constructEvent).not.toHaveBeenCalled();
    });

    it('should throw error when webhook secret is not configured', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);
      const payload = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 'sig_123';

      // Act & Assert
      expect(() => service.constructEvent(payload, signature, false)).toThrow(
        'Stripe webhook secret is not configured',
      );
    });

    it('should handle invalid JSON payload when skipping verification', () => {
      // Arrange
      const payload = Buffer.from('invalid json');
      const signature = 'any_signature';

      // Act & Assert
      expect(() => service.constructEvent(payload, signature, true)).toThrow();
    });

    it('should handle empty payload when skipping verification', () => {
      // Arrange
      const payload = Buffer.from('{}');
      const signature = 'any_signature';

      // Act
      const result = service.constructEvent(payload, signature, true);

      // Assert
      expect(result).toEqual({});
    });

    it('should handle complex event payload when skipping verification', () => {
      // Arrange
      const complexPayload = {
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
      const payload = Buffer.from(JSON.stringify(complexPayload));
      const signature = 'any_signature';

      // Act
      const result = service.constructEvent(payload, signature, true);

      // Assert
      expect(result).toEqual(complexPayload);
    });

    it('should throw error when signature verification fails', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('whsec_123');
      const payload = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 'invalid_signature';
      service['stripe'].webhooks = {
        constructEvent: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      } as any;

      // Act & Assert
      expect(() => service.constructEvent(payload, signature, false)).toThrow(
        'Invalid signature',
      );
    });
  });
});
