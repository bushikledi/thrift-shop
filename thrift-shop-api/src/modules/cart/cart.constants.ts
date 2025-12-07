/**
 * Shared constants for cart-related Prisma includes
 * These patterns are used across CartService to maintain consistency
 */

/**
 * Product include for cart items - includes first image and basic vendor info
 */
export const CART_PRODUCT_INCLUDE = {
  media: {
    take: 1,
    orderBy: { sortOrder: 'asc' } as const,
  },
  vendor: {
    select: {
      id: true,
      name: true,
      displayName: true,
    },
  },
} as const;

/**
 * Full cart item include with product details
 */
export const CART_ITEM_INCLUDE = {
  product: {
    include: CART_PRODUCT_INCLUDE,
  },
} as const;

/**
 * Full cart session include with items and products
 */
export const CART_SESSION_INCLUDE = {
  items: {
    include: CART_ITEM_INCLUDE,
  },
} as const;
