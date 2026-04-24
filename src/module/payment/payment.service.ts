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

  async createPayment(data: Partial<Payment>) {
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
