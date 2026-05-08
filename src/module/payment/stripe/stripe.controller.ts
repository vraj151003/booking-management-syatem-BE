import { Controller, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BookingService } from '../../booking/booking.service';
import { PaymentService } from '../../payment/payment.service';
import { ConcessionService } from '../../concession/concession.service';
import { ConcessionOrderStatus } from '../../concession/entity/concession-order.entity';
import { Inject, forwardRef } from '@nestjs/common';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    @Inject(forwardRef(() => BookingService))
    private bookingService: BookingService,
    private paymentService: PaymentService,
    @Inject(forwardRef(() => ConcessionService))
    private concessionService: ConcessionService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
    let buffer: Buffer;

    // Handle both arrayBuffer (actual Stripe) and raw body (testing with curl)
    if (typeof req.arrayBuffer === 'function') {
      const body = await req.arrayBuffer();
      buffer = Buffer.from(body);
    } else {
      // For testing with curl - use raw body
      buffer = Buffer.from(JSON.stringify(req.body));
    }

    // Skip signature verification - parse payload directly
    const event = JSON.parse(buffer.toString());
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata && metadata.type === 'concession') {
          await this.concessionService.markOrderAsPaid(Number(metadata.orderId), paymentIntent.id);
        } else {
          await this.paymentService.markSuccess(paymentIntent.id);
          await this.bookingService.confrimBooking(paymentIntent.id);
        }
        break;
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const failedMetadata = failedIntent.metadata;

        if (failedMetadata && failedMetadata.type === 'concession') {
          // Handle failed concession payment if needed
          await this.concessionService.updateOrderStatus(Number(failedMetadata.orderId), ConcessionOrderStatus.CANCELLED);
        } else {
          await this.paymentService.markFailed(failedIntent.id);
          await this.bookingService.failBooking(failedIntent.id);
        }
        break;
      case 'payment_intent.canceled':
        const canceledIntent = event.data.object;
        const canceledMetadata = canceledIntent.metadata;

        if (canceledMetadata && canceledMetadata.type === 'concession') {
          await this.concessionService.updateOrderStatus(Number(canceledMetadata.orderId), ConcessionOrderStatus.CANCELLED);
        } else {
          await this.paymentService.markFailed(canceledIntent.id);
          await this.bookingService.failBooking(canceledIntent.id);
        }
        break;
      default:
        break;
    }
    return { received: true };
  }
}
