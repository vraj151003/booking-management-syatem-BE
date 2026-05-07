import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Repository } from 'typeorm';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  calculateGST(baseAmount: number): { gstRate: number; gstAmount: number; totalAmount: number } {
    const gstRate = baseAmount <= 100 ? 12 : 18;
    const gstAmount = (baseAmount * gstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    return {
      gstRate,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  async createPayment(data: Partial<Payment>) {
    // If baseAmount is provided but GST fields are not, calculate them automatically
    if (data.baseAmount && (!data.gstRate || !data.gstAmount || !data.totalAmount)) {
      const gstCalculation = this.calculateGST(data.baseAmount);
      data.gstRate = gstCalculation.gstRate;
      data.gstAmount = gstCalculation.gstAmount;
      data.totalAmount = gstCalculation.totalAmount;
    }

    const payment = this.paymentRepo.create(data);
    return this.paymentRepo.save(payment);
  }

  async markSuccess(paymentIntentId: string, transactionId?: string) {
    const payment = await this.paymentRepo.findOne({
      where: { paymentIntentId },
    });

    if (!payment) return;

    payment.status = PaymentStatus.SUCCESS;
    payment.transactionId = transactionId ?? null;

    return this.paymentRepo.save(payment);
  }
   async markFailed(paymentIntentId: string, reason?: string) {
    const payment = await this.paymentRepo.findOne({
      where: { paymentIntentId },
    });

    if (!payment) return;

    payment.status = PaymentStatus.FAILED;
    payment.failureReason = reason ?? null;

    return this.paymentRepo.save(payment);
  }

  async findAllPayments(filters?: PaymentFilterDto) {
    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('payment.user', 'user');

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(payment.paymentIntentId) LIKE LOWER(:search) OR LOWER(payment.transactionId) LIKE LOWER(:search) OR LOWER(payment.currency) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    // Apply payment intent ID filter
    if (filters?.paymentIntentId) {
      queryBuilder.andWhere('payment.paymentIntentId = :paymentIntentId', { paymentIntentId: filters.paymentIntentId });
    }

    // Apply transaction ID filter
    if (filters?.transactionId) {
      queryBuilder.andWhere('payment.transactionId = :transactionId', { transactionId: filters.transactionId });
    }

    // Apply user filter
    if (filters?.userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId: filters.userId });
    }

    // Apply booking filter
    if (filters?.bookingId) {
      queryBuilder.andWhere('payment.bookingId = :bookingId', { bookingId: filters.bookingId });
    }

    // Apply amount filters
    if (filters?.minAmount) {
      queryBuilder.andWhere('payment.totalAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters?.maxAmount) {
      queryBuilder.andWhere('payment.totalAmount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Apply currency filter
    if (filters?.currency) {
      queryBuilder.andWhere('payment.currency = :currency', { currency: filters.currency });
    }

    const payments = await queryBuilder.getMany();

    return {
      message: 'Payments retrieved successfully',
      data: payments,
    };
  }

  async findPaymentsByUser(userId: string, filters?: PaymentFilterDto) {
    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .where('payment.userId = :userId', { userId });

    // Apply search filter
    if (filters?.search) {
      queryBuilder.andWhere(
        '(LOWER(payment.paymentIntentId) LIKE LOWER(:search) OR LOWER(payment.transactionId) LIKE LOWER(:search) OR LOWER(payment.currency) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Apply status filter
    if (filters?.status) {
      queryBuilder.andWhere('payment.status = :status', { status: filters.status });
    }

    // Apply payment intent ID filter
    if (filters?.paymentIntentId) {
      queryBuilder.andWhere('payment.paymentIntentId = :paymentIntentId', { paymentIntentId: filters.paymentIntentId });
    }

    // Apply transaction ID filter
    if (filters?.transactionId) {
      queryBuilder.andWhere('payment.transactionId = :transactionId', { transactionId: filters.transactionId });
    }

    // Apply booking filter
    if (filters?.bookingId) {
      queryBuilder.andWhere('payment.bookingId = :bookingId', { bookingId: filters.bookingId });
    }

    // Apply amount filters
    if (filters?.minAmount) {
      queryBuilder.andWhere('payment.totalAmount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters?.maxAmount) {
      queryBuilder.andWhere('payment.totalAmount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    // Apply date range filter
    if (filters?.startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59);
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    // Apply currency filter
    if (filters?.currency) {
      queryBuilder.andWhere('payment.currency = :currency', { currency: filters.currency });
    }

    const payments = await queryBuilder.getMany();

    return {
      message: 'User payments retrieved successfully',
      data: payments,
    };
  }
}
