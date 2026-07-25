import { group } from 'k6';
import { get } from './lib/http.js';

/**
 * One VU, one pass over the public read endpoints.
 *
 * This is a wiring check, not a benchmark: it proves the target is up, seeded
 * and reachable before anyone spends minutes on a real run, and it is cheap
 * enough to keep in CI. Latency budgets are loose on purpose — a cold start
 * should not fail the build.
 */
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate==0'],
    checks: ['rate==1'],
    throttled_responses: ['count==0'],
  },
};

export default function () {
  group('health', () => {
    get('health', '/health');
  });

  group('catalogue', () => {
    const res = get('products:list', '/products?limit=5');
    const first = res.status === 200 ? res.json('data.0') : null;

    get('products:featured', '/products/featured?limit=4');
    get('categories:tree', '/categories');
    get('vendors:list', '/vendors?limit=5&verified=true');

    if (first?.slug) {
      get('products:detail', `/products/${first.slug}`);
    }
  });

  group('search', () => {
    get('search:full', '/search?q=vintage&limit=5');
    get('search:suggestions', '/search/suggestions?q=vi');
  });
}
