import { sleep, group } from 'k6';
import { thresholds } from './lib/config.js';
import { get } from './lib/http.js';
import { loadCatalogFixtures, sample } from './lib/catalog.js';

/**
 * Anonymous catalogue browsing — the traffic the storefront actually gets.
 *
 * Read-only by design: it can be pointed at any environment without leaving
 * orders, carts or users behind.
 */
export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP || '30s', target: Number(__ENV.VUS || 20) },
        { duration: __ENV.DURATION || '1m', target: Number(__ENV.VUS || 20) },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    ...thresholds,
    // The catalogue listing is the hot path; hold it to a tighter budget.
    'endpoint_duration{name:products:list}': ['p(95)<500'],
    throttled_responses: ['count==0'],
  },
};

export function setup() {
  return loadCatalogFixtures();
}

export default function (fixtures) {
  group('landing', () => {
    get('products:featured', '/products/featured?limit=8');
    get('categories:tree', '/categories');
  });
  sleep(1);

  group('shop', () => {
    get('products:list', '/products?page=1&limit=12');
    get('products:list', '/products?page=2&limit=12');
  });
  sleep(1);

  group('category', () => {
    const slug = sample(fixtures.categorySlugs);
    if (slug) {
      get('products:byCategory', `/products?categorySlug=${slug}&limit=12`);
    }
  });
  sleep(1);

  group('product detail', () => {
    const slug = sample(fixtures.productSlugs);
    const res = get('products:detail', `/products/${slug}`);
    // The reviews route keys off the product id, not the slug, so it has to
    // come from the detail response a real page load would already have.
    const id = res.status === 200 ? res.json('id') : null;
    if (id) {
      get('reviews:byProduct', `/reviews/product/${id}?limit=10`);
    }
  });
  sleep(2);
}
