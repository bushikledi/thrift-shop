import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { DiscountType } from '../../generated/prisma/client';

export interface AppliedPromo {
  id: string;
  code: string;
  description: string | null;
  discount: number;
}

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resolves a code and computes what it is worth for a given subtotal.
   *
   * Every rejection uses the same generic message so the endpoint cannot be
   * used to enumerate which codes exist or why one failed.
   */
  async validate(code: string, subtotal: number): Promise<AppliedPromo> {
    const normalized = code.trim().toUpperCase();

    const promo = await this.prisma.promoCode.findUnique({
      where: { code: normalized },
    });

    const now = new Date();
    const isRedeemable =
      promo !== null &&
      promo.isActive &&
      (promo.startsAt === null || promo.startsAt <= now) &&
      (promo.expiresAt === null || promo.expiresAt > now) &&
      (promo.usageLimit === null || promo.usageCount < promo.usageLimit);

    if (!isRedeemable) {
      throw new BadRequestException('This promo code is not valid');
    }

    // The minimum is worth stating plainly - the shopper can act on it, and it
    // does not reveal anything they could not learn by adding another item.
    const minOrderTotal = promo.minOrderTotal
      ? Number(promo.minOrderTotal)
      : null;
    if (minOrderTotal !== null && subtotal < minOrderTotal) {
      throw new BadRequestException(
        `This code requires a minimum order of ${minOrderTotal.toFixed(2)}`,
      );
    }

    return {
      id: promo.id,
      code: promo.code,
      description: promo.description,
      discount: this.computeDiscount(
        subtotal,
        promo.discountType,
        Number(promo.discountValue),
        promo.maxDiscount ? Number(promo.maxDiscount) : null,
      ),
    };
  }

  /**
   * Records a redemption. Guarded so a code cannot exceed its usage limit even
   * if two checkouts race: the update only matches while there is headroom.
   */
  async recordRedemption(promoId: string): Promise<void> {
    const result = await this.prisma.promoCode.updateMany({
      where: {
        id: promoId,
        OR: [
          { usageLimit: null },
          { usageCount: { lt: this.usageLimitRef() } },
        ],
      },
      data: { usageCount: { increment: 1 } },
    });

    if (result.count === 0) {
      this.logger.warn(
        `Promo ${promoId} was not incremented - it likely hit its usage limit`,
      );
    }
  }

  /**
   * Prisma cannot compare two columns directly in a where clause, so the
   * limit check is expressed against the column via a raw field reference.
   */
  private usageLimitRef() {
    return this.prisma.promoCode.fields.usageLimit;
  }

  /** Never discounts more than the subtotal, and honours any cap. */
  private computeDiscount(
    subtotal: number,
    type: DiscountType,
    value: number,
    maxDiscount: number | null,
  ): number {
    let discount =
      type === DiscountType.PERCENTAGE ? (subtotal * value) / 100 : value;

    if (maxDiscount !== null) {
      discount = Math.min(discount, maxDiscount);
    }

    discount = Math.min(discount, subtotal);

    return Math.round(discount * 100) / 100;
  }
}
