/**
 * Soak Test
 *
 * Extended duration test to find memory leaks, connection issues, etc.
 * 500 req/s for 1 hour.
 *
 * Run: k6 run soak-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    soak_test: {
      executor: 'constant-arrival-rate',
      rate: 500,
      timeUnit: '1s',
      duration: '1h',
      preAllocatedVUs: 200,
      maxVUs: 500,
      gracefulStop: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95) < 300', 'avg < 150'],
    'http_req_failed': ['rate < 0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  console.log('Starting 1-hour soak test...');
  console.log('Monitor for: memory leaks, connection pool exhaustion, slow degradation');

  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `soak-test-user`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (authRes.status !== 200) {
    throw new Error('Could not authenticate.');
  }

  console.log('✓ Auth token acquired, starting soak test...');
  return { authToken: JSON.parse(authRes.body).token };
}

function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export default function (data) {
  const headers = getHeaders(data.authToken);
  const coin = Math.random();

  if (coin < 0.6) {
    const res = http.get(`${BASE_URL}/api/todos`, { headers });
    check(res, { 'read ok': (r) => r.status === 200 });
  } else if (coin < 0.8) {
    const res = http.post(
      `${BASE_URL}/api/todos`,
      JSON.stringify({ title: `Soak ${__VU}-${__ITER}` }),
      { headers }
    );
    check(res, { 'create ok': (r) => r.status === 201 });
  } else if (coin < 0.9) {
    const res = http.patch(
      `${BASE_URL}/api/todos/todo-1`,
      JSON.stringify({ title: `Updated ${__ITER}` }),
      { headers }
    );
    check(res, { 'update ok': (r) => r.status >= 200 && r.status < 300 });
  } else {
    const res = http.del(`${BASE_URL}/api/todos/todo-${(__ITER % 1000)}`, null, { headers });
    check(res, { 'delete ok': (r) => r.status >= 200 && r.status < 300 });
  }
}

export function teardown() {
  console.log('Soak test completed!');
  console.log('Check metrics for any degradation over time');
}
