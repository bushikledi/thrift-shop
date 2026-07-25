import { sleep, group } from 'k6';
import { thresholds } from './lib/config.js';
import { get } from './lib/http.js';

/**
 * Search and autocomplete.
 *
 * Kept separate from browse.js because search does `contains` scans across
 * title/description/brand/tags with no full-text index — it is the first thing
 * expected to bend under load, and mixing it into the browse numbers would
 * hide that.
 */
export const options = {
  scenarios: {
    search: {
      executor: 'constant-arrival-rate',
      // Model a fixed request rate rather than a VU count: search traffic is
      // driven by typing, not by how fast the server replies.
      rate: Number(__ENV.RATE || 20),
      timeUnit: '1s',
      duration: __ENV.DURATION || '1m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    ...thresholds,
    // Autocomplete fires on keystrokes, so it gets the strictest budget.
    'endpoint_duration{name:search:suggestions}': ['p(95)<300'],
    'endpoint_duration{name:search:full}': ['p(95)<1000'],
    throttled_responses: ['count==0'],
  },
};

const TERMS = [
  'vintage',
  'denim',
  'nike',
  'leather',
  'jacket',
  'dress',
  'shoes',
  'bag',
];

/** Prefixes exercise the autocomplete path the way typing does. */
const PREFIXES = ['vi', 'de', 'ni', 'le', 'ja', 'dr', 'sh', 'ba'];

export default function () {
  const term = TERMS[Math.floor(Math.random() * TERMS.length)];
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

  group('autocomplete', () => {
    get('search:suggestions', `/search/suggestions?q=${prefix}`);
  });

  group('full search', () => {
    get('search:full', `/search?q=${term}&limit=20`);
  });

  group('filtered search', () => {
    get(
      'search:filtered',
      `/search?q=${term}&limit=20&conditions=LIKE_NEW,GOOD&sort=price_asc`,
    );
  });

  sleep(1);
}
