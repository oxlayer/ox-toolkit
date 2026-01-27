/**
 * Spike Test
 *
 * Test how the system handles sudden traffic spikes.
 * Normal: 100 req/s → Spike: 5000 req/s → Recovery
 *
 * Run: k6 run spike-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    spike_test: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 2000,
      duration: '3m',
      gracefulStop: '10s',
      stages: [
        { duration: '30s', target: 100 },
        { duration: '10s', target: 5000 },
        { duration: '20s', target: 5000 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 5000 },
        { duration: '20s', target: 5000 },
        { duration: '30s', target: 100 },
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95) < 500', 'p(99) < 1000'],
    'http_req_failed': ['rate < 0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `spike-test-user`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (authRes.status !== 200) {
    throw new Error('Could not authenticate.');
  }

  console.log('Spike test: 100 -> 5000 req/s -> recovery');
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
  const res = http.get(`${BASE_URL}/api/todos`, { headers });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
