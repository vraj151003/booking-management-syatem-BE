import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { Repository } from 'typeorm';

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
}
