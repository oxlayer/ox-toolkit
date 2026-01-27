/**
 * K6 Load Test for Alo Manager API
 *
 * Target: 3000 requests/second sustained load
 *
 * Run: k6 run load-test.js
 * With HTML report: k6 run --out html=report.html load-test.js
 *
 * Set BASE_URL env var to override default (default: http://localhost:3001)
 */

import http from 'k6/http';
import { check } from 'k6';

// Test configuration
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
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      maxVUs: 2000,
      startTime: '5m',
      stages: [
        { duration: '30s', target: 3000 },
        { duration: '30s', target: 5000 },
        { duration: '30s', target: 7000 },
        { duration: '30s', target: 10000 },
        { duration: '1m', target: 10000 },
        { duration: '30s', target: 0 },
      ],
      exec: 'stressTest',
    },
  },
  thresholds: {
    'http_req_duration': {
      '95% under 200ms during normal load': 'p(95) < 200',
      '99% under 500ms during normal load': 'p(99) < 500',
      'max under 1s': 'max < 1000',
    },
    'http_req_failed': ['rate < 0.01'],
    'http_reqs': ['count > 10000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Setup: Get JWT token for all VUs
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Fetching JWT token from /auth/token/anonymous...');

  const authRes = http.post(`${BASE_URL}/auth/token/anonymous`, JSON.stringify({
    userId: `perf-test-user`,
    metadata: {},
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (authRes.status !== 200) {
    console.error(`Failed to get auth token: ${authRes.status}`);
    console.error(`Response: ${authRes.body}`);
    throw new Error('Could not authenticate. Make sure the server is running and /auth/token/anonymous is accessible.');
  }

  const authBody = JSON.parse(authRes.body);
  console.log(`✓ Auth token acquired: ${authBody.token?.substring(0, 30)}...`);

  return { authToken: authBody.token };
}

// Helper to get headers with auth token
function getHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export default function (data) {
  const operation = Math.random();
  const headers = getHeaders(data.authToken);

  if (operation < 0.40) {
    listEstablishments(headers);
  } else if (operation < 0.55) {
    listUsers(headers);
  } else if (operation < 0.75) {
    createEstablishment(headers);
  } else if (operation < 0.90) {
    createUser(headers);
  } else if (operation < 0.95) {
    getEstablishment(headers);
  } else {
    updateEstablishment(headers);
  }
}

export function stressTest(data) {
  const headers = getHeaders(data.authToken);
  if (Math.random() < 0.70) {
    listEstablishments(headers);
  } else if (Math.random() < 0.90) {
    listUsers(headers);
  } else {
    createEstablishment(headers);
  }
}

function listEstablishments(headers) {
  const res = http.get(`${BASE_URL}/api/establishments?limit=20`, { headers });
  check(res, {
    'list establishments status is 200': (r) => r.status === 200,
    'list establishments has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).establishments);
      } catch { return false; }
    },
    'list establishments response time < 100ms': (r) => r.timings.duration < 100,
  });
}

function listUsers(headers) {
  const res = http.get(`${BASE_URL}/api/users?limit=20`, { headers });
  check(res, {
    'list users status is 200': (r) => r.status === 200,
    'list users has array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).users);
      } catch { return false; }
    },
    'list users response time < 100ms': (r) => r.timings.duration < 100,
  });
}

function createEstablishment(headers) {
  const payload = JSON.stringify({
    name: `Perf Test Restaurant ${__VU}-${__ITER}`,
    horarioFuncionamento: 'Mon-Fri 9AM-10PM',
    description: 'Performance test establishment',
    ownerId: 1,
  });

  const res = http.post(`${BASE_URL}/api/establishments`, payload, { headers });
  check(res, {
    'create establishment status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'create establishment response time < 200ms': (r) => r.timings.duration < 200,
  });
}

function createUser(headers) {
  const payload = JSON.stringify({
    name: `Perf Test User ${__VU}-${__ITER}`,
    email: `perf-test-${__VU}-${__ITER}@example.com`,
    password: 'password123',
  });

  const res = http.post(`${BASE_URL}/api/users`, payload, { headers });
  check(res, {
    'create user status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'create user response time < 200ms': (r) => r.timings.duration < 200,
  });
}

function getEstablishment(headers) {
  const establishmentId = (__VU % 10) + 1;
  const res = http.get(`${BASE_URL}/api/establishments/${establishmentId}`, { headers });
  check(res, {
    'get establishment status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'get establishment response time < 100ms': (r) => r.timings.duration < 100,
  });
}

function updateEstablishment(headers) {
  const establishmentId = (__VU % 10) + 1;
  const payload = JSON.stringify({ description: `Updated ${__ITER}` });

  const res = http.patch(`${BASE_URL}/api/establishments/${establishmentId}`, payload, { headers });
  check(res, {
    'update establishment status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'update establishment response time < 150ms': (r) => r.timings.duration < 150,
  });
}

export function teardown() {
  console.log('Load test completed!');
}
