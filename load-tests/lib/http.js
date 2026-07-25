import http from 'k6/http';
import { check, fail } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, jsonHeaders, rateLimited } from './config.js';

/**
 * Counts responses the rate limiter produced. Any value above zero means the
 * run measured the throttle, not the endpoint.
 */
export const throttled = new Counter('throttled_responses');

/** Per-endpoint latency, so a slow route is identifiable in the summary. */
export const endpointDuration = new Trend('endpoint_duration', true);

/**
 * GET with a name tag, threshold-friendly checks and throttle detection.
 *
 * `name` groups URLs that differ only by id — without it k6 reports one row
 * per product slug and the summary becomes unreadable.
 */
export function get(name, path, params = {}) {
  const res = http.get(`${BASE_URL}${path}`, {
    ...params,
    tags: { ...(params.tags || {}), name },
  });

  if (rateLimited(res)) {
    throttled.add(1, { name });
  }

  endpointDuration.add(res.timings.duration, { name });
  check(res, {
    [`${name}: 200`]: (r) => r.status === 200,
  });

  return res;
}

export function post(name, path, body, params = {}) {
  const res = http.post(`${BASE_URL}${path}`, JSON.stringify(body), {
    ...params,
    headers: { ...jsonHeaders, ...(params.headers || {}) },
    tags: { ...(params.tags || {}), name },
  });

  if (rateLimited(res)) {
    throttled.add(1, { name });
  }

  endpointDuration.add(res.timings.duration, { name });
  return res;
}

/** Parses a JSON body, failing the iteration with context rather than throwing. */
export function json(res, name) {
  try {
    return res.json();
  } catch {
    fail(`${name}: expected JSON, got ${res.status} ${res.body?.slice(0, 120)}`);
  }
}
