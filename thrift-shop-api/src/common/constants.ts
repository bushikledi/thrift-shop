/**
 * Application-wide constants
 */

// Password hashing
export const BCRYPT_ROUNDS = 12;

// Slug generation
export const SLUG_UUID_LENGTH = 8;
export const MAX_SLUG_GENERATION_ATTEMPTS = 10;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PRODUCT_DETAIL: 300, // 5 minutes
  FEATURED: 600, // 10 minutes
  RELATED: 300, // 5 minutes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  PRODUCT_BY_SLUG: 'product:slug:',
  PRODUCT_BY_ID: 'product:id:',
  FEATURED_PRODUCTS: 'products:featured',
  RELATED_PRODUCTS: 'products:related:',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MAX_LIMIT_STRICT: 50, // For endpoints that should have stricter limits
} as const;

// Cart configuration
export const CART = {
  SESSION_EXPIRY_DAYS: 30,
} as const;

// Media configuration
export const MEDIA = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  // Square crop used for listing grids and cart rows.
  THUMB_WIDTH: 300,
  // Longest edge for detail views; images smaller than this are not upscaled.
  MEDIUM_WIDTH: 900,
} as const;
