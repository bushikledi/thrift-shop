-- AddCheckConstraint: Ensure product price is positive
ALTER TABLE "products" ADD CONSTRAINT "products_price_positive" CHECK ("price" > 0);

-- AddCheckConstraint: Ensure review rating is between 1 and 5
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5);

-- AddCheckConstraint: Ensure order amounts are positive
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_positive" CHECK ("subtotal" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_positive" CHECK ("total" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_amount_non_negative" CHECK ("shipping_amount" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_non_negative" CHECK ("discount" >= 0);

-- AddCheckConstraint: Ensure order item amounts are positive
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_positive" CHECK ("price" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

-- AddCheckConstraint: Ensure product quantity is non-negative
ALTER TABLE "products" ADD CONSTRAINT "products_quantity_non_negative" CHECK ("quantity" >= 0);

-- AddCheckConstraint: Ensure vendor rating is between 0 and 5
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_rating_range" CHECK ("rating" >= 0 AND "rating" <= 5);

-- AddCheckConstraint: Ensure vendor review count is non-negative
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_review_count_non_negative" CHECK ("review_count" >= 0);

-- AddCheckConstraint: Ensure product view count is non-negative
ALTER TABLE "products" ADD CONSTRAINT "products_view_count_non_negative" CHECK ("view_count" >= 0);
