/**
 * Test Setup
 *
 * Global test configuration and utilities.
 */

import { beforeAll, afterAll } from 'bun:test';

/**
 * Test environment setup
 */
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce noise in tests

  // Initialize test database if needed
  // await initializeTestDatabase();

  console.log('[Test Setup] Environment configured');
});

/**
 * Test environment cleanup
 */
afterAll(async () => {
  // Cleanup test database
  // await cleanupTestDatabase();

  // Shutdown any open connections
  // await shutdownTestServices();

  console.log('[Test Setup] Environment cleaned up');
});

/**
 * Test utilities
 */
export const TestUtils = {
  /**
   * Generate a random test ID
   */
  randomId(): string {
    return Math.random().toString(36).substring(7);
  },

  /**
   * Generate a random email
   */
  randomEmail(): string {
    return `test-${this.randomId()}@example.com`;
  },

  /**
   * Generate a random phone number
   */
  randomPhone(): string {
    return `+55119${Math.floor(Math.random() * 100000000)}`;
  },

  /**
   * Wait for a specified duration
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
