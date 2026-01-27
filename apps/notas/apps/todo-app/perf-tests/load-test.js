/**
 * K6 Load Test for Todo App
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
    throw new Error('Could not authenticate. Make sure the server is running and /auth/anonymous is accessible.');
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

  if (operation < 0.70) {
    listTodos(headers);
  } else if (operation < 0.90) {
    createTodo(headers);
  } else if (operation < 0.95) {
    updateTodo(headers);
  } else {
    deleteTodo(headers);
  }
}

export function stressTest(data) {
  const headers = getHeaders(data.authToken);
  if (Math.random() < 0.90) {
    listTodos(headers);
  } else {
    createTodo(headers);
  }
}

function listTodos(headers) {
  const res = http.get(`${BASE_URL}/api/todos`, { headers });
  check(res, {
    'list status is 200': (r) => r.status === 200,
    'list has todos array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).todos);
      } catch { return false; }
    },
    'list response time < 100ms': (r) => r.timings.duration < 100,
  });
}

function createTodo(headers) {
  const payload = JSON.stringify({
    title: `Perf Test ${__VU}-${__ITER}`,
  });

  const res = http.post(`${BASE_URL}/api/todos`, payload, { headers });
  check(res, {
    'create status is 201': (r) => r.status === 201,
    'create has todo object': (r) => {
      try {
        return JSON.parse(r.body).todo?.id;
      } catch { return false; }
    },
    'create response time < 200ms': (r) => r.timings.duration < 200,
  });
}

function updateTodo(headers) {
  const todoId = `todo-${(__VU % 100) + 1}`;
  const payload = JSON.stringify({ title: `Updated ${__ITER}` });

  const res = http.patch(`${BASE_URL}/api/todos/${todoId}`, payload, { headers });
  check(res, {
    'update status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'update response time < 150ms': (r) => r.timings.duration < 150,
  });
}

function deleteTodo(headers) {
  const todoId = `todo-${(__VU % 100) + 1}`;
  const res = http.del(`${BASE_URL}/api/todos/${todoId}`, null, { headers });
  check(res, {
    'delete status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'delete response time < 150ms': (r) => r.timings.duration < 150,
  });
}

export function teardown() {
  console.log('Load test completed!');
}
