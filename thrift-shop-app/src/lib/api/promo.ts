/**
 * Promo Code API Service
 */
import { post } from "../apiClient";

export interface PromoValidation {
  code: string;
  description: string | null;
  discount: number;
  subtotalAfterDiscount: number;
}

export const promoApi = {
  /**
   * Check a code against a cart subtotal. Rejections come back as ApiErrors
   * carrying the message to show the shopper.
   */
  validate: (code: string, subtotal: number): Promise<PromoValidation> =>
    post<PromoValidation, { code: string; subtotal: number }>(
      "/promo/validate",
      { code, subtotal }
    ),
};

export default promoApi;
