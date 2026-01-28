/**
 * K6 Load Test for {{PROJECT_NAME}} API
 *
 * Target: 3000 requests/second sustained load
 *
 * Run: k6 run load-test.js
 * With HTML report: k6 run --out html=report.html load-test.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    sustained_load: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 1000,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 2000 },
        { duration: '30s', target: 3000 },
        { duration: '2m', target: 3000 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration': {
      '95% under 200ms': 'p(95) < 200',
      '99% under 500ms': 'p(99) < 500',
    },
    'http_req_failed': ['rate < 0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:{{PORT}}';

export default function () {
  const operation = Math.random();

  if (operation < 0.70) {
    listItems();
  } else if (operation < 0.90) {
    createItem();
  } else {
    getItem();
  }
}

function listItems() {
  const res = http.get(`${BASE_URL}/api/items`);
  check(res, {
    'list status is 200': (r) => r.status === 200,
    'list has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).items);
      } catch { return false; }
    },
    'list response time < 100ms': (r) => r.timings.duration < 100,
  });
}

function createItem() {
  const payload = JSON.stringify({
    name: `Perf Test Item ${__VU}-${__ITER}`,
  });

  const res = http.post(`${BASE_URL}/api/items`, payload);
  check(res, {
    'create status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'create response time < 200ms': (r) => r.timings.duration < 200,
  });
}

function getItem() {
  const itemId = (__VU % 10) + 1;
  const res = http.get(`${BASE_URL}/api/items/${itemId}`);
  check(res, {
    'get status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get response time < 100ms': (r) => r.timings.duration < 100,
  });
}

export function teardown() {
  console.log('Load test completed!');
}
