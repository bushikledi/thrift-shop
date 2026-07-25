/**
 * Shared configuration for the k6 suites.
 *
 * BASE_URL defaults to the API's in-network address: running k6 inside the
 * compose network keeps host port-forwarding out of the measurement. Override
 * it to point at a deployed environment.
 */
export const BASE_URL = __ENV.BASE_URL || 'http://api:3000/api/v1';

/** Seeded demo credentials; override for other environments. */
export const CUSTOMER_EMAIL = __ENV.CUSTOMER_EMAIL || 'chris.wilson@email.com';
export const CUSTOMER_PASSWORD = __ENV.CUSTOMER_PASSWORD || 'password123';

/**
 * Pass/fail budgets. A load test that only prints numbers gets ignored, so
 * every suite fails the run when latency or errors cross these lines.
 *
 * The p95 targets are deliberately generous: this profile is meant to catch
 * regressions (an N+1 creeping into the catalogue query, a missing index),
 * not to certify production capacity on a laptop.
 */
export const thresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<800', 'p(99)<2000'],
  checks: ['rate>0.99'],
};

/**
 * A 429 means the rate limiter answered instead of the endpoint, so the
 * numbers describe the throttle rather than the app. Fail loudly rather than
 * reporting a fast, meaningless result.
 *
 * Raise THROTTLE_LIMIT on the API before a real run — see the README.
 */
export function rateLimited(res) {
  return res.status === 429;
}

export const jsonHeaders = { 'Content-Type': 'application/json' };
