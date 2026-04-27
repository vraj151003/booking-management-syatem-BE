import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Repository } from 'typeorm';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: Repository<Payment>;

  const mockPaymentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));

    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    const mockPaymentData = {
      booking: { id: 'booking-123' } as any,
      user: { id: 'user-123' } as any,
      amount: 500,
      currency: 'INR',
      paymentIntentId: 'pi-123',
      status: PaymentStatus.PENDING,
    };

    const mockSavedPayment = {
      id: 'payment-123',
      ...mockPaymentData,
    };

    it('should create payment successfully', async () => {
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

    it('should handle payment creation with minimal data', async () => {
      // Arrange
      const minimalData = {
        amount: 100,
        currency: 'INR',
        paymentIntentId: 'pi-456',
      };
      mockPaymentRepo.create.mockReturnValue(minimalData);
      mockPaymentRepo.save.mockResolvedValue({ id: 'payment-456', ...minimalData });

      // Act
      const result = await service.createPayment(minimalData);

      // Assert
      expect(result).toBeDefined();
      expect(mockPaymentRepo.create).toHaveBeenCalledWith(minimalData);
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
