-- Promo codes.
--
-- The cart had a promo field that always answered "Invalid promo code" because
-- no codes existed anywhere. Orders already carry a discount column, which is
-- what a redeemed code now populates.

CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount" DECIMAL(10,2),
    "min_order_total" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX "promo_codes_code_is_active_idx" ON "promo_codes"("code", "is_active");

-- A percentage must be a sensible percentage, and any amount must be positive.
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_discount_value_check"
  CHECK ("discount_value" > 0 AND ("discount_type" <> 'PERCENTAGE' OR "discount_value" <= 100));
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_usage_count_check"
  CHECK ("usage_count" >= 0);
