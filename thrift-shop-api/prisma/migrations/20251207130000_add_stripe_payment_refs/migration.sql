-- Stripe payment references for card checkout.
--
-- Only Stripe identifiers are stored; no card data ever reaches this database.
-- A single checkout can produce several orders (one per vendor) that share one
-- Stripe session/payment intent, so these columns are intentionally not unique.

ALTER TABLE "orders" ADD COLUMN "stripe_session_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "stripe_payment_intent_id" TEXT;

-- Webhooks look orders up by session id.
CREATE INDEX "orders_stripe_session_id_idx" ON "orders"("stripe_session_id");
