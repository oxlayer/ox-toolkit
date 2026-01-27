/**
 * Quick Smoke Test
 *
 * Light load test for quick validation before full runs.
 * 100 req/s for 30 seconds.
 *
 * Run: k6 run quick-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    quick_smoke: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95) < 200'],
    'http_req_failed': ['rate < 0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  console.log(`Starting quick test against: ${BASE_URL}`);

  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `perf-test-user`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (authRes.status !== 200) {
    throw new Error('Could not authenticate. Server running?');
  }

  const token = JSON.parse(authRes.body).token;
  console.log(`✓ Auth token acquired`);

  return { authToken: token };
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

  if (coin < 0.7) {
    const res = http.get(`${BASE_URL}/api/todos`, { headers });
    check(res, { 'read ok': (r) => r.status === 200 });
  } else {
    const res = http.post(
      `${BASE_URL}/api/todos`,
      JSON.stringify({ title: `Todo ${__ITER}` }),
      { headers }
    );
    check(res, { 'create ok': (r) => r.status === 201 });
  }
}
