/**
 * K6 Soak Test for {{PROJECT_NAME}} API
 *
 * Long-running test to detect memory leaks and performance degradation.
 *
 * Run: k6 run soak-test.js
 * Duration: 1 hour at steady load
 */

import http from 'k6/http';

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

const BASE_URL = __ENV.BASE_URL || 'http://localhost:{{PORT}}';

export default function () {
  const operation = Math.random();

  if (operation < 0.60) {
    http.get(`${BASE_URL}/api/items`);
  } else if (operation < 0.80) {
    http.get(`${BASE_URL}/health`);
  } else {
    http.get(`${BASE_URL}/api/items/${Math.floor(Math.random() * 10) + 1}`);
  }
}

export function teardown() {
  console.log('Soak test completed!');
}
