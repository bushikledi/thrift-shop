-- CreateIndex
CREATE INDEX "orders_buyer_id_status_created_at_idx" ON "orders"("buyer_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_vendor_id_status_created_at_idx" ON "orders"("vendor_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "password_resets_email_used_expires_at_idx" ON "password_resets"("email", "used", "expires_at");

-- CreateIndex
CREATE INDEX "products_vendor_id_is_active_idx" ON "products"("vendor_id", "is_active");

-- CreateIndex
CREATE INDEX "products_created_at_idx" ON "products"("created_at" DESC);

-- CreateIndex
CREATE INDEX "products_category_id_is_active_created_at_idx" ON "products"("category_id", "is_active", "created_at" DESC);

-- CreateIndex
CREATE INDEX "products_category_id_is_active_price_idx" ON "products"("category_id", "is_active", "price");

-- CreateIndex
CREATE INDEX "products_is_active_price_idx" ON "products"("is_active", "price");

-- CreateIndex
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_vendor_id_created_at_idx" ON "reviews"("vendor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_rating_idx" ON "reviews"("product_id", "rating");

-- CreateIndex
CREATE INDEX "reviews_vendor_id_rating_idx" ON "reviews"("vendor_id", "rating");
