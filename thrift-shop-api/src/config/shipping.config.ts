import { registerAs } from '@nestjs/config';

export default registerAs('shipping', () => ({
  baseRate: parseFloat(process.env.SHIPPING_BASE_RATE || '5.99'),
  perItemRate: parseFloat(process.env.SHIPPING_PER_ITEM_RATE || '1.5'),
  weightRate: parseFloat(process.env.SHIPPING_WEIGHT_RATE || '0.5'), // per 100g
  freeShippingThreshold: parseFloat(
    process.env.SHIPPING_FREE_THRESHOLD || '75',
  ),
  expressMultiplier: parseFloat(
    process.env.SHIPPING_EXPRESS_MULTIPLIER || '2.5',
  ),
  overnightMultiplier: parseFloat(
    process.env.SHIPPING_OVERNIGHT_MULTIPLIER || '4.0',
  ),
}));
