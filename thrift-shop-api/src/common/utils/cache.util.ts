import { Cache } from 'cache-manager';
import { CACHE_KEYS } from '../constants';

/**
 * Invalidate cache keys matching a pattern
 * For Redis stores, this will use pattern matching
 * For in-memory stores, this will delete known keys
 */
export async function invalidateCachePattern(
  cacheManager: Cache,
  pattern: string,
): Promise<void> {
  // Try to use Redis pattern matching if available
  const store = (
    cacheManager as unknown as {
      store: { keys?: (pattern: string) => Promise<string[]> };
    }
  ).store;
  if (store && typeof store.keys === 'function') {
    try {
      const keys = await store.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((key: string) => cacheManager.del(key)));
      }
    } catch {
      // Fallback to manual deletion if pattern matching fails
      // This is expected for in-memory cache
    }
  }
}

/**
 * Invalidate all featured products cache variants
 */
export async function invalidateFeaturedProductsCache(
  cacheManager: Cache,
): Promise<void> {
  const pattern = `${CACHE_KEYS.FEATURED_PRODUCTS}:*`;
  await invalidateCachePattern(cacheManager, pattern);

  // Also delete common variants as fallback
  const commonLimits = [4, 8, 12, 16, 20];
  await Promise.all(
    commonLimits.map((limit) =>
      cacheManager.del(`${CACHE_KEYS.FEATURED_PRODUCTS}:${limit}`),
    ),
  );
}
