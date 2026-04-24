import { Controller, Post, Req, Headers } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BookingService } from '../../booking/booking.service';
import { PaymentService } from '../../payment/payment.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private bookingService: BookingService,
    private paymentService: PaymentService,
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

    // Skip signature verification for testing with fake signature
    const event = this.stripeService.constructEvent(buffer, sig, sig === 'YOUR_STRIPE_WEBHOOK_SIGNATURE');
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await this.paymentService.markSuccess(paymentIntent.id);
        await this.bookingService.confrimBooking(paymentIntent.id);
        break;
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await this.paymentService.markFailed(failedIntent.id);
        await this.bookingService.failBooking(failedIntent.id);
        break;
      case 'payment_intent.canceled':
        const canceledIntent = event.data.object;
        await this.paymentService.markFailed(canceledIntent.id);
        await this.bookingService.failBooking(canceledIntent.id);
        break;
      default:
        break;
    }
    return { received: true };
  }
}
