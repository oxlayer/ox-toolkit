/**
 * K6 Soak Test for Alo Manager API
 *
 * Long-running test to detect memory leaks and performance degradation.
 *
 * Run: k6 run soak-test.js
 * Duration: 1 hour at steady load
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    steady_load: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '1h',
      preAllocatedVUs: 200,
      maxVUs: 500,
    },
  },
  thresholds: {
    'http_req_duration': ['p(95) < 300', 'avg < 150'],
    'http_req_failed': ['rate < 0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export function setup() {
  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `soak-test-user`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (authRes.status !== 200) {
    throw new Error('Could not authenticate for soak test');
  }

  const authBody = JSON.parse(authRes.body);
  console.log('✓ Soak test auth token acquired');
  return { authToken: authBody.token };
}

function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export default function (data) {
  const headers = getHeaders(data.authToken);
  const operation = Math.random();

  if (operation < 0.60) {
    http.get(`${BASE_URL}/api/establishments`, { headers });
  } else if (operation < 0.80) {
    http.get(`${BASE_URL}/api/users`, { headers });
  } else if (operation < 0.90) {
    http.get(`${BASE_URL}/api/delivery-men`, { headers });
  } else {
    http.get(`${BASE_URL}/api/service-providers`, { headers });
  }
}

export function teardown(data) {
  console.log('Soak test completed!');
}
