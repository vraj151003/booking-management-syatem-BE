import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('database.stripeSecretKey');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey);
  }

  async createPaymentIntent(amount: number){
    return this.stripe.paymentIntents.create({
        amount : amount * 100,
        currency : 'inr',
        payment_method_types : ['card']
    })
  }

  constructEvent(payload: Buffer, sig : string, skipVerification = false){
    if (skipVerification) {
      // For testing: parse payload without signature verification
      return JSON.parse(payload.toString());
    }

    const webhookSecret = this.configService.get<string>('database.stripeWebhookSecret');
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }
    return this.stripe.webhooks.constructEvent(
        payload,
        sig,
        webhookSecret
    )
  }
}
