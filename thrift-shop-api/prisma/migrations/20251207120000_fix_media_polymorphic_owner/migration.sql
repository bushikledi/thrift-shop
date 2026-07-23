-- Media is polymorphic (PRODUCT | VENDOR | USER | CATEGORY), but owner_id was
-- constrained by a foreign key to products(id). That made it impossible to
-- attach media to a vendor, user, or category: every such insert failed with a
-- foreign key violation (vendor logos/banners and user avatars could never be
-- saved).
--
-- Split the two concerns: owner_id stays the generic polymorphic key, and a new
-- nullable product_id carries the real foreign key for product media so the
-- Product -> media relation and its cascade delete keep working.

-- Drop the foreign key that forced every media row to reference a product.
ALTER TABLE "media" DROP CONSTRAINT "media_owner_id_fkey";

-- Add the concrete product foreign key column.
ALTER TABLE "media" ADD COLUMN "product_id" TEXT;

-- Backfill existing product media (all existing rows referenced a product,
-- since the old constraint permitted nothing else).
UPDATE "media" SET "product_id" = "owner_id" WHERE "owner_type" = 'PRODUCT';

CREATE INDEX "media_product_id_idx" ON "media"("product_id");

ALTER TABLE "media"
  ADD CONSTRAINT "media_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
