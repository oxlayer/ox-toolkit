/**
 * Test Setup
 *
 * Global test configuration and utilities.
 */

/**
 * Global test setup hook (called by test runner)
 * This is intentionally empty - the actual setup is done by individual test files
 * when using their test framework (Bun, Vitest, Jest, etc.)
 */
export async function globalSetup(): Promise<void> {
  // Setup global test configuration
  // - Initialize test database
  // - Setup test Redis
  // - Configure test event bus
}

/**
 * Create a test context with auth headers
 */
export function createTestContext(userId = 'user-1') {
  return {
    userId,
    get headers() {
      return {
        'Authorization': `Bearer ${createMockToken(userId)}`,
      };
    },
  };
}

/**
 * Create a mock JWT token for testing
 */
export function createMockToken(userId: string): string {
  const payload = {
    sub: userId,
    email: 'test@example.com',
    preferred_username: 'Test User',
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + 3600,
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Wait for async operations
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with timeout
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      return await operation();
    } catch (error) {
      if (Date.now() - startTime + interval >= timeout) {
        throw error;
      }
      await wait(interval);
    }
  }

  throw new Error('Operation timeout');
}
