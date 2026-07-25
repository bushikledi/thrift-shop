import http from 'k6/http';
import { sleep, group, check } from 'k6';
import { Counter } from 'k6/metrics';
import {
  thresholds,
  BASE_URL,
  CUSTOMER_EMAIL,
  CUSTOMER_PASSWORD,
} from './lib/config.js';
import { get, post } from './lib/http.js';
import { loadCatalogFixtures, sample } from './lib/catalog.js';

/**
 * Authenticated cart and checkout.
 *
 * THIS SUITE WRITES. It creates carts and places real orders, and checkout
 * decrements stock. Run it against a throwaway database only — never one whose
 * data you care about. It is excluded from `npm run load` for that reason and
 * has to be asked for by name.
 *
 * Two things the API requires that are easy to get wrong here:
 *  - the cart is keyed by a `cart_session` cookie, not by the logged-in user,
 *    so the per-VU cookie jar has to carry it between requests;
 *  - checkout takes that cart's id as `cartSessionId`, and a shipping address
 *    shaped { street, city, state, zip, country }.
 *
 * Login happens once in setup rather than per iteration: /auth/login is
 * throttled to 10/min per IP by design, so logging in per VU would measure
 * that limit instead of the checkout path.
 *
 * Two ceilings shape the default profile:
 *  - /orders/checkout carries its own @Throttle of 10/min per IP, set in
 *    orders.controller.ts. Unlike the global limit it is not env-driven, so a
 *    throughput test has to raise it there. The default arrival rate below
 *    stays under it, which makes this a concurrency-correctness run.
 *  - seeded listings are near-unique thrift items, so stock runs out quickly.
 *    A sold-out product is a correct answer, not a failure, and is counted
 *    separately from server errors.
 */

/** 5xx only. Anything here is a real defect; 4xx may just be sold out. */
const serverErrors = new Counter('server_errors');

/** Listings that ran out of stock mid-run — expected, tracked for context. */
const soldOut = new Counter('sold_out');

export const options = {
  scenarios: {
    checkout: {
      executor: 'constant-arrival-rate',
      // Default sits under the route's 10/min cap. Raise RATE only after
      // raising the @Throttle in orders.controller.ts.
      rate: Number(__ENV.RATE || 8),
      timeUnit: '1m',
      duration: __ENV.DURATION || '1m',
      preAllocatedVUs: 5,
      maxVUs: Number(__ENV.VUS || 10),
    },
  },
  thresholds: {
    ...thresholds,
    // http_req_failed counts every non-2xx, and a sold-out listing answers 400
    // legitimately. Correctness is asserted through checks and server_errors
    // instead, so this suite does not inherit the shared 1% budget.
    http_req_failed: undefined,
    server_errors: ['count==0'],
    // Checkout writes across several tables in a transaction; allow more room.
    'endpoint_duration{name:orders:checkout}': ['p(95)<3000'],
    throttled_responses: ['count==0'],
  },
};

export function setup() {
  const fixtures = loadCatalogFixtures();

  const loginRes = post('auth:login', '/auth/login', {
    email: CUSTOMER_EMAIL,
    password: CUSTOMER_PASSWORD,
  });

  if (loginRes.status !== 200) {
    throw new Error(
      `Login failed (${loginRes.status}). Set CUSTOMER_EMAIL/CUSTOMER_PASSWORD, ` +
        'or seed the database first.',
    );
  }

  const token = loginRes.cookies?.access_token?.[0]?.value;
  if (!token) {
    throw new Error('Login succeeded but no access_token cookie was returned.');
  }

  return { ...fixtures, token };
}

export default function (data) {
  // Seed this VU's jar with the session token. Everything after this relies on
  // the jar, which is also what lets the server-set cart_session cookie follow
  // the VU from "add to cart" through to checkout.
  const jar = http.cookieJar();
  jar.set(BASE_URL, 'access_token', data.token);

  let productId = null;

  group('pick a product', () => {
    const slug = sample(data.productSlugs);
    const res = get('products:detail', `/products/${slug}`);
    productId = res.status === 200 ? res.json('id') : null;
  });

  if (!productId) {
    return;
  }

  let cartSessionId = null;

  group('cart', () => {
    const addRes = post('cart:add', '/cart/items', { productId, quantity: 1 });
    if (addRes.status >= 500) serverErrors.add(1, { name: 'cart:add' });
    if (addRes.status === 400) soldOut.add(1);

    check(addRes, {
      'cart:add created or sold out': (r) =>
        r.status === 201 || r.status === 200 || r.status === 400,
    });

    if (addRes.status !== 201 && addRes.status !== 200) {
      return;
    }

    const cartRes = get('cart:get', '/cart');
    cartSessionId = cartRes.status === 200 ? cartRes.json('id') : null;
    check(cartRes, {
      'cart:get has items': (r) => (r.json('itemCount') || 0) > 0,
    });
  });
  sleep(1);

  if (!cartSessionId) {
    return;
  }

  group('checkout', () => {
    const res = post('orders:checkout', '/orders/checkout', {
      cartSessionId,
      shippingAddress: {
        street: '1 Load Street',
        city: 'Tirana',
        state: 'TR',
        zip: '1001',
        country: 'AL',
      },
      paymentMethod: 'COD',
      shippingMethod: 'standard',
    });

    if (res.status >= 500) serverErrors.add(1, { name: 'orders:checkout' });

    check(res, {
      'checkout:order placed': (r) => r.status === 201 || r.status === 200,
    });
  });
  sleep(2);
}
