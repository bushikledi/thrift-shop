import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// The stripe package sets `module.exports` to the constructor itself and this
// project compiles to CommonJS without esModuleInterop, so a default import
// would resolve to undefined at runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import Stripe = require('stripe');
import { PrismaService } from '../../prisma';
import { OrderStatus, PaymentStatus } from '../../generated/prisma/client';

/** Minimal shape of the orders a checkout session is created for. */
export interface PayableOrder {
  id: string;
  orderNumber: string;
  total: unknown; // Prisma Decimal
  vendorId: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret?: string;
  private readonly currency: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    this.webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    this.currency = this.configService.get<string>('stripe.currency') || 'usd';

    if (secretKey) {
      this.stripe = new Stripe(secretKey);
      this.logger.log('Stripe client initialized');
    } else {
      this.stripe = null;
      this.logger.warn(
        'STRIPE_SECRET_KEY not set - card payments disabled (cash on delivery only)',
      );
    }
  }

  get isEnabled(): boolean {
    return this.stripe !== null;
  }

  /**
   * Creates a Stripe Checkout session covering every order produced by one
   * checkout.
   *
   * The amount is always computed from the persisted order totals, never from
   * anything the client sent. Card details are collected by Stripe's hosted
   * page, so they never touch this server.
   */
  async createCheckoutSession(
    orders: PayableOrder[],
    options: { customerEmail?: string; successUrl: string; cancelUrl: string },
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Card payments are not available. Please choose cash on delivery.',
      );
    }

    if (orders.length === 0) {
      throw new BadRequestException('No orders to pay for');
    }

    const lineItems = orders.map((order) => ({
      price_data: {
        currency: this.currency,
        product_data: {
          name: `Order ${order.orderNumber}`,
        },
        unit_amount: this.toMinorUnits(order.total),
      },
      quantity: 1,
    }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      customer_email: options.customerEmail,
      metadata: {
        orderIds: orders.map((o) => o.id).join(','),
        orderNumbers: orders.map((o) => o.orderNumber).join(','),
      },
    });

    if (!session.url) {
      throw new ServiceUnavailableException(
        'Stripe did not return a checkout URL',
      );
    }

    // Link the session to its orders so the webhook can settle them.
    await this.prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) } },
      data: { stripeSessionId: session.id },
    });

    this.logger.log(
      `Created Stripe checkout session ${session.id} for orders ${orders
        .map((o) => o.orderNumber)
        .join(', ')}`,
    );

    return { sessionId: session.id, url: session.url };
  }

  /**
   * Verifies a webhook signature and returns the parsed event.
   *
   * The raw request body is required: any re-serialisation invalidates the
   * signature.
   */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET is not configured',
      );
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Rejected webhook with invalid signature: ${message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /** Applies a verified Stripe event to the orders it refers to. */
  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // `paid` covers card payments; delayed methods settle via async events.
        if (session.payment_status === 'paid') {
          await this.markSessionPaid(session);
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        await this.markSessionPaid(event.data.object);
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        await this.markSessionFailed(event.data.object);
        break;
      }

      default:
        this.logger.debug(`Ignoring unhandled Stripe event: ${event.type}`);
    }
  }

  private async markSessionPaid(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    const result = await this.prisma.order.updateMany({
      // Only advance orders still awaiting payment, so repeated webhook
      // deliveries are harmless.
      where: {
        stripeSessionId: session.id,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
        confirmedAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      },
    });

    this.logger.log(
      `Stripe session ${session.id} paid - confirmed ${result.count} order(s)`,
    );
  }

  private async markSessionFailed(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const result = await this.prisma.order.updateMany({
      where: {
        stripeSessionId: session.id,
        paymentStatus: PaymentStatus.PENDING,
      },
      data: { paymentStatus: PaymentStatus.FAILED },
    });

    this.logger.warn(
      `Stripe session ${session.id} failed/expired - marked ${result.count} order(s) unpaid`,
    );
  }

  /** Converts a Decimal-like total to integer minor units (e.g. cents). */
  private toMinorUnits(total: unknown): number {
    const amount = Number(total);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('Invalid order total');
    }
    return Math.round(amount * 100);
  }
}
