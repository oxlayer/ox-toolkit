/**
 * K6 Quick Test for Alo Manager API
 *
 * Quick smoke test to verify API is working correctly.
 *
 * Run: k6 run quick-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 200', 'p(99) < 500'],
    http_req_failed: ['rate < 0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  // Get anonymous token
  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `test-user-${__VU}`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const hasAuth = check(authRes, {
    'auth status is 200': (r) => r.status === 200,
    'auth has token': (r) => {
      try {
        return JSON.parse(r.body).token?.length > 0;
      } catch { return false; }
    },
  });

  if (!hasAuth) {
    return;
  }

  const authBody = JSON.parse(authRes.body);
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authBody.token}`,
  };

  // Test health endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health has services': (r) => {
      try {
        return typeof JSON.parse(r.body).services === 'object';
      } catch { return false; }
    },
  });

  // Test establishments list
  const establishmentsRes = http.get(`${BASE_URL}/api/establishments`, { headers });
  check(establishmentsRes, {
    'establishments status is 200': (r) => r.status === 200,
    'establishments has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).establishments);
      } catch { return false; }
    },
  });

  // Test users list
  const usersRes = http.get(`${BASE_URL}/api/users`, { headers });
  check(usersRes, {
    'users status is 200': (r) => r.status === 200,
    'users has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).users);
      } catch { return false; }
    },
  });
}

export function handleSummary(data) {
  console.log('\n=== Quick Test Summary ===');
  console.log(`Total requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed requests: ${data.metrics.http_req_failed.values.count}`);
  console.log(`P95 latency: ${data.metrics.http_req_duration.values['p(95)']}ms`);
  console.log(`P99 latency: ${data.metrics.http_req_duration.values['p(99)']}ms`);
}
