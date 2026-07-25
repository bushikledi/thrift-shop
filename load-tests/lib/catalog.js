import { get, json } from './http.js';

/**
 * Fetches a page of product slugs and category slugs once, in setup(), so the
 * scenarios can request real detail pages.
 *
 * Hitting the same hardcoded slug from every VU would sit permanently in the
 * database's buffer cache and flatter the results.
 */
export function loadCatalogFixtures() {
  const productsRes = get('setup:products', '/products?limit=50');
  const categoriesRes = get('setup:categories', '/categories');

  const products = json(productsRes, 'setup:products');
  const categories = json(categoriesRes, 'setup:categories');

  const productSlugs = (products?.data || [])
    .map((p) => p.slug)
    .filter(Boolean);

  const categorySlugs = (Array.isArray(categories) ? categories : [])
    .flatMap((c) => [c.slug, ...(c.children || []).map((child) => child.slug)])
    .filter(Boolean);

  if (productSlugs.length === 0) {
    throw new Error(
      'No products returned — is the database seeded? Run: npm run db:seed',
    );
  }

  return { productSlugs, categorySlugs };
}

/** Deterministic-ish pick that still spreads load across the fixture set. */
export function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}
