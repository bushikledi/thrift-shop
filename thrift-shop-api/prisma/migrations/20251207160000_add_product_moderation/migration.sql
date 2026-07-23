-- Product moderation.
--
-- The admin panel had a "flag for review" dialog that collected a reason and
-- then discarded it. Record the flag so moderation state actually survives.

ALTER TABLE "products" ADD COLUMN "flagged_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "flag_reason" TEXT;

-- Admins list flagged products first.
CREATE INDEX "products_flagged_at_idx" ON "products"("flagged_at");
