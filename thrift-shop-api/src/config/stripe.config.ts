import { registerAs } from '@nestjs/config';

/**
 * Stripe configuration.
 *
 * Entirely optional: when no secret key is present the platform runs in
 * cash-on-delivery-only mode and card checkout is rejected with a clear error
 * rather than failing at startup.
 */
export default registerAs('stripe', () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  return {
    secretKey,
    webhookSecret,
    // Stripe expects a lowercase ISO currency code.
    currency: (process.env.STRIPE_CURRENCY || 'usd').toLowerCase(),
    isConfigured: Boolean(secretKey),
  };
});
