/**
 * Test Setup
 *
 * Global test configuration and utilities.
 */

import { beforeAll, afterAll } from 'bun:test';

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(async () => {
  // Cleanup
});

export const TestUtils = {
  randomId(): string {
    return Math.random().toString(36).substring(7);
  },
};
