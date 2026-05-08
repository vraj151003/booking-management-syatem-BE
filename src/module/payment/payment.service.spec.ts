import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Repository } from 'typeorm';
import { FirebaseService } from '../firebase/firebase.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: Repository<Payment>;

  const mockPaymentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFirebaseService = {
    sendPaymentNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));

    jest.clearAllMocks();
  });

  describe('calculateGST', () => {
    it('should calculate 12% GST for tickets <= 100', () => {
      // Act
      const result = service.calculateGST(90);

      // Assert
      expect(result.gstRate).toBe(12);
      expect(result.gstAmount).toBe(10.8);
      expect(result.totalAmount).toBe(100.8);
    });

    it('should calculate 12% GST for tickets exactly 100', () => {
      // Act
      const result = service.calculateGST(100);

      // Assert
      expect(result.gstRate).toBe(12);
      expect(result.gstAmount).toBe(12);
      expect(result.totalAmount).toBe(112);
    });

    it('should calculate 18% GST for tickets > 100', () => {
      // Act
      const result = service.calculateGST(200);

      // Assert
      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBe(36);
      expect(result.totalAmount).toBe(236);
    });

    it('should calculate 18% GST for tickets > 100 with decimal', () => {
      // Act
      const result = service.calculateGST(150);

      // Assert
      expect(result.gstRate).toBe(18);
      expect(result.gstAmount).toBe(27);
      expect(result.totalAmount).toBe(177);
    });

    it('should round GST amount to 2 decimal places', () => {
      // Act
      const result = service.calculateGST(99.99);

      // Assert
      expect(result.gstRate).toBe(12);
      expect(result.gstAmount).toBe(12); // 99.99 * 0.12 = 11.9988, rounded to 12
      expect(result.totalAmount).toBe(111.99); // 99.99 + 12 = 111.99
    });
  });

  describe('createPayment', () => {
    const mockPaymentData = {
      booking: { id: 'booking-123' } as any,
      user: { id: 'user-123' } as any,
      baseAmount: 90,
      gstRate: 12,
      gstAmount: 10.8,
      totalAmount: 100.8,
      currency: 'INR',
      paymentIntentId: 'pi-123',
      status: PaymentStatus.PENDING,
    };

    const mockSavedPayment = {
      id: 'payment-123',
      ...mockPaymentData,
    };

    it('should create payment successfully with GST fields', async () => {
      // Arrange
      mockPaymentRepo.create.mockReturnValue(mockPaymentData);
      mockPaymentRepo.save.mockResolvedValue(mockSavedPayment);

      // Act
      const result = await service.createPayment(mockPaymentData);

      // Assert
      expect(result).toEqual(mockSavedPayment);
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(mockPaymentData);
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(mockPaymentData);
    });

    it('should auto-calculate GST when baseAmount is provided but GST fields are missing', async () => {
      // Arrange
      const dataWithoutGST = {
        booking: { id: 'booking-123' } as any,
        user: { id: 'user-123' } as any,
        baseAmount: 90,
        currency: 'INR',
        paymentIntentId: 'pi-123',
        status: PaymentStatus.PENDING,
      };

      const expectedData = {
        ...dataWithoutGST,
        gstRate: 12,
        gstAmount: 10.8,
        totalAmount: 100.8,
      };

      mockPaymentRepo.create.mockReturnValue(expectedData);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-123', ...expectedData });

      // Act
      const result = await service.createPayment(dataWithoutGST);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(expectedData);
    });

    it('should auto-calculate 18% GST for baseAmount > 100', async () => {
      // Arrange
      const dataWithoutGST = {
        booking: { id: 'booking-123' } as any,
        user: { id: 'user-123' } as any,
        baseAmount: 200,
        currency: 'INR',
        paymentIntentId: 'pi-123',
        status: PaymentStatus.PENDING,
      };

      const expectedData = {
        ...dataWithoutGST,
        gstRate: 18,
        gstAmount: 36,
        totalAmount: 236,
      };

      mockPaymentRepo.create.mockReturnValue(expectedData);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-123', ...expectedData });

      // Act
      const result = await service.createPayment(dataWithoutGST);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(expectedData);
    });

    it('should not auto-calculate GST when all GST fields are already provided', async () => {
      // Arrange
      const dataWithGST = {
        booking: { id: 'booking-123' } as any,
        user: { id: 'user-123' } as any,
        baseAmount: 90,
        gstRate: 12,
        gstAmount: 10.8,
        totalAmount: 100.8,
        currency: 'INR',
        paymentIntentId: 'pi-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepo.create.mockReturnValue(dataWithGST);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-123', ...dataWithGST });

      // Act
      const result = await service.createPayment(dataWithGST);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(dataWithGST);
    });

    it('should not auto-calculate GST when baseAmount is not provided', async () => {
      // Arrange
      const dataWithoutBaseAmount = {
        booking: { id: 'booking-123' } as any,
        user: { id: 'user-123' } as any,
        currency: 'INR',
        paymentIntentId: 'pi-123',
        status: PaymentStatus.PENDING,
      };

      mockPaymentRepo.create.mockReturnValue(dataWithoutBaseAmount);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-123', ...dataWithoutBaseAmount });

      // Act
      const result = await service.createPayment(dataWithoutBaseAmount);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(dataWithoutBaseAmount);
    });

    it('should handle payment creation with all optional fields', async () => {
      // Arrange
      const fullData = {
        ...mockPaymentData,
        method: 'card',
        transactionId: 'txn-123',
        failureReason: null,
      };
      mockPaymentRepo.create.mockReturnValue(fullData);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-123', ...fullData });

      // Act
      const result = await service.createPayment(fullData);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(fullData);
    });

    it('should throw error when save fails', async () => {
      // Arrange
      mockPaymentRepo.create.mockReturnValue(mockPaymentData);
      mockPaymentRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createPayment(mockPaymentData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('markSuccess', () => {
    const mockPayment = {
      id: 'payment-123',
      paymentIntentId: 'pi-123',
      status: PaymentStatus.PENDING,
      transactionId: null,
    };

    it('should mark payment as success with transactionId', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
        transactionId: 'txn-123',
      });

      // Act
      const result = await service.markSuccess('pi-123', 'txn-123');

      // Assert
      expect(result?.status).toBe(PaymentStatus.SUCCESS);
      expect(result?.transactionId).toBe('txn-123');
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should mark payment as success without transactionId', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
        transactionId: null,
      });

      // Act
      const result = await service.markSuccess('pi-123');

      // Assert
      expect(result?.status).toBe(PaymentStatus.SUCCESS);
      expect(result?.transactionId).toBeNull();
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should mark payment as success with undefined transactionId', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
        transactionId: null,
      });

      // Act
      const result = await service.markSuccess('pi-123', undefined);

      // Assert
      expect(result?.status).toBe(PaymentStatus.SUCCESS);
      expect(result?.transactionId).toBeNull();
    });

    it('should return undefined when payment not found', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.markSuccess('pi-123');

      // Assert
      expect(result).toBeUndefined();
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should handle empty transactionId string', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.SUCCESS,
        transactionId: '',
      });

      // Act
      const result = await service.markSuccess('pi-123', '');

      // Assert
      expect(result?.status).toBe(PaymentStatus.SUCCESS);
      expect(result?.transactionId).toBe('');
    });

    it('should throw error when save fails', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.markSuccess('pi-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('markFailed', () => {
    const mockPayment = {
      id: 'payment-123',
      paymentIntentId: 'pi-123',
      status: PaymentStatus.PENDING,
      failureReason: null,
    };

    it('should mark payment as failed with reason', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failureReason: 'Insufficient funds',
      });

      // Act
      const result = await service.markFailed('pi-123', 'Insufficient funds');

      // Assert
      expect(result?.status).toBe(PaymentStatus.FAILED);
      expect(result?.failureReason).toBe('Insufficient funds');
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should mark payment as failed without reason', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failureReason: null,
      });

      // Act
      const result = await service.markFailed('pi-123');

      // Assert
      expect(result?.status).toBe(PaymentStatus.FAILED);
      expect(result?.failureReason).toBeNull();
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('should mark payment as failed with undefined reason', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failureReason: null,
      });

      // Act
      const result = await service.markFailed('pi-123', undefined);

      // Assert
      expect(result?.status).toBe(PaymentStatus.FAILED);
      expect(result?.failureReason).toBeNull();
    });

    it('should return undefined when payment not found', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(null);

      // Act
      const result = await service.markFailed('pi-123');

      // Assert
      expect(result).toBeUndefined();
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });

    it('should handle empty reason string', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failureReason: '',
      });

      // Act
      const result = await service.markFailed('pi-123', '');

      // Assert
      expect(result?.status).toBe(PaymentStatus.FAILED);
      expect(result?.failureReason).toBe('');
    });

    it('should handle long failure reason', async () => {
      // Arrange
      const longReason = 'A'.repeat(500);
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
        failureReason: longReason,
      });

      // Act
      const result = await service.markFailed('pi-123', longReason);

      // Assert
      expect(result?.status).toBe(PaymentStatus.FAILED);
      expect(result?.failureReason).toBe(longReason);
    });

    it('should throw error when save fails', async () => {
      // Arrange
      mockPaymentRepo.findOne.mockResolvedValue(mockPayment);
      mockPaymentRepo.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.markFailed('pi-123')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
