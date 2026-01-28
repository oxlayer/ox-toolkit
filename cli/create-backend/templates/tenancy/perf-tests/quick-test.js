/**
 * K6 Quick Test for {{PROJECT_NAME}} API
 *
 * Quick smoke test to verify API is working.
 *
 * Run: k6 run quick-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 200'],
    http_req_failed: ['rate < 0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:{{PORT}}';

export default function () {
  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health has status': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch { return false; }
    },
  });

  // Test items list
  const itemsRes = http.get(`${BASE_URL}/api/items`);
  check(itemsRes, {
    'items status is 200': (r) => r.status === 200,
    'items has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).items);
      } catch { return false; }
    },
  });
}

export function handleSummary(data) {
  console.log('\n=== Quick Test Summary ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.count}`);
  console.log(`P95 latency: ${data.metrics.http_req_duration.values['p(95)']}ms`);
}
