/**
 * Shapes a persisted order item into the public OrderItemProductDto contract
 * ({ id, name, slug, images }). The stored Product uses `title`/`media`, and
 * list queries may not join the product at all — so prefer the immutable
 * per-order `title` snapshot and fall back to the live product. This keeps the
 * API response aligned with its documented schema instead of leaking raw
 * Prisma field names to the client.
 */
interface MediaLike {
  url: string;
}

interface ProductLike {
  id: string;
  title?: string | null;
  slug?: string | null;
  media?: MediaLike[] | null;
}

interface OrderItemLike {
  productId?: string | null;
  title?: string | null;
  product?: ProductLike | null;
}

export interface OrderItemProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
}

export function mapOrderItemProduct(item: OrderItemLike): OrderItemProduct {
  const product = item.product ?? null;
  return {
    id: product?.id ?? item.productId ?? '',
    name: item.title ?? product?.title ?? 'Product',
    slug: product?.slug ?? '',
    images: (product?.media ?? []).map((m) => m.url),
  };
}

/**
 * Returns a shallow copy of an order with each item's `product` normalized to
 * the documented shape. Accepts any order object that carries an `items` array.
 */
export function mapOrderItems<
  T extends { items: OrderItemLike[] },
>(order: T): Omit<T, 'items'> & {
  items: Array<T['items'][number] & { product: OrderItemProduct }>;
} {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: mapOrderItemProduct(item),
    })),
  };
}
