/**
 * Security Test Patterns
 *
 * Reusable test patterns for security testing including XSS prevention,
 * SQL injection prevention, input validation, and more.
 *
 * @example
 * ```typescript
 * import { describeSecurityTests, XSS_PATTERNS } from '@oxlayer/capabilities-testing/patterns/security';
 *
 * describeSecurityTests({
 *   createUseCase: () => new CreateTodoUseCase(...),
 *   executeUseCase: (useCase, input) => useCase.execute(input),
 *   getInput: (maliciousTitle) => ({ title: maliciousTitle, userId: 'test-user' }),
 *   assertSanitized: (result) => {
 *     expect(result.success).toBe(true);
 *     expect(result.data.title).not.toContain('<script>');
 *   }
 * });
 * ```
 */

/**
 * A result type for use case operations
 */
export type AppResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };

export interface SecurityTestPatternOptions<TInput, TOutput> {
  /**
   * Factory function to create the use case
   */
  createUseCase: () => unknown;

  /**
   * Execute the use case with the given input
   */
  executeUseCase: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input with a potentially malicious value
   */
  getInput: (maliciousValue: string) => TInput;

  /**
   * Assert that the output was sanitized correctly
   */
  assertSanitized: (result: AppResult<TOutput>) => void;

  /**
   * Field name being tested (for error messages)
   */
  fieldName?: string;
}

/**
 * Security attack pattern for testing
 */
export interface SecurityPattern {
  /** The malicious input to test */
  input: string;
  /** Description of what this pattern tests */
  description: string;
}

/**
 * XSS Attack Patterns
 */
export const XSS_PATTERNS: SecurityPattern[] = [
  { input: '<script>alert("XSS")</script>', description: 'script tag' },
  { input: '<img src=x onerror="alert(1)">', description: 'onerror attribute' },
  { input: '<svg onload="alert(1)">', description: 'SVG onload' },
  { input: 'javascript:alert("XSS")', description: 'javascript protocol' },
  { input: 'data:text/html,<script>alert(1)</script>', description: 'data URI' },
  { input: '<iframe src="javascript:alert(1)">', description: 'iframe injection' },
  { input: '<body onload="alert(1)">', description: 'body onload' },
  { input: '<input onfocus="alert(1)" autofocus>', description: 'input autofocus' },
  { input: '<select onfocus="alert(1)" autofocus><option>', description: 'select focus' },
  { input: '<textarea onfocus="alert(1)" autofocus>', description: 'textarea focus' },
  { input: '" onmouseover="alert(1)" x="', description: 'attribute injection' },
  { input: "' onmouseover='alert(1)' x='", description: 'single quote injection' },
  { input: '`;alert(1);//`', description: 'backtick injection' },
  { input: '<!--<script>alert(1)</script>-->', description: 'comment-wrapped script' },
  { input: '<div style="background:url(javascript:alert(1))">', description: 'CSS injection' },
  { input: '<style>@import "javascript:alert(1)";</style>', description: 'CSS import' },
  { input: '<a href="javascript:alert(1)">click</a>', description: 'anchor javascript' },
  { input: '</textarea><script>alert(1)</script><textarea>', description: 'textarea break' },
];

/**
 * SQL Injection Patterns
 */
export const SQL_INJECTION_PATTERNS: SecurityPattern[] = [
  { input: "' OR '1'='1", description: 'OR injection' },
  { input: "' OR 1=1--", description: 'comment injection' },
  { input: "' UNION SELECT * FROM users--", description: 'UNION injection' },
  { input: "'; DROP TABLE users; --", description: 'DROP TABLE' },
  { input: "' OR '1'='1'#", description: 'MySQL comment' },
  { input: "admin'--", description: 'comment login bypass' },
  { input: "admin'#", description: 'MySQL comment bypass' },
  { input: "' OR 1=1#", description: 'OR with comment' },
  { input: "1' AND '1'='1", description: 'AND injection' },
  { input: "' AND 1=2 UNION SELECT '1', '2'--", description: 'UNION with AND' },
];

/**
 * NoSQL Injection Patterns
 */
export const NOSQL_INJECTION_PATTERNS: SecurityPattern[] = [
  { input: '{$ne: null}', description: '$ne operator' },
  { input: '{$regex: ".*"}', description: '$regex operator' },
  { input: '{$gt: ""}', description: '$gt operator' },
  { input: '{$where: "this.password == this.username"}', description: '$where injection' },
  { input: '{"$ne": null}', description: 'JSON $ne' },
  { input: '"; return db.users.find(); //', description: 'code injection' },
];

/**
 * Path Traversal Patterns
 */
export const PATH_TRAVERSAL_PATTERNS: SecurityPattern[] = [
  { input: '../../../etc/passwd', description: 'traversal with ../' },
  { input: '..\\..\\..\\windows\\system32\\config\\sam', description: 'Windows traversal' },
  { input: '%2e%2e%2f%2e%2e%2fetc%2fpasswd', description: 'URL-encoded traversal' },
  { input: '....//....//....//etc/passwd', description: 'double-dot traversal' },
  { input: '/var/www/../../etc/passwd', description: 'absolute path traversal' },
  { input: '..%252f..%252f..%252fetc/passwd', description: 'double-encoded traversal' },
];

/**
 * Command Injection Patterns
 */
export const COMMAND_INJECTION_PATTERNS: SecurityPattern[] = [
  { input: '; ls -la', description: 'semicolon command' },
  { input: '| cat /etc/passwd', description: 'pipe command' },
  { input: '`whoami`', description: 'backtick command' },
  { input: '$(cat /etc/passwd)', description: 'command substitution' },
  { input: '&& rm -rf /', description: 'AND command' },
  { input: '|| reboot', description: 'OR command' },
  { input: '; cat /etc/passwd #', description: 'comment after command' },
  { input: '\nls -la', description: 'newline command' },
  { input: '\rwhoami', description: 'carriage return command' },
  { input: '`id`', description: 'backtick id' },
];

/**
 * Denial of Service Patterns
 */
export const DOS_PATTERNS: SecurityPattern[] = [
  { input: 'a'.repeat(100000), description: 'excessively long input' },
  { input: '{'.repeat(50000), description: 'deep nesting attempt' },
  { input: 'a'.repeat(10000) + ',' + 'b'.repeat(10000), description: 'large array' },
  { input: '\u0000'.repeat(10000), description: 'null byte flood' },
  { input: '../'.repeat(10000), description: 'long traversal' },
];

/**
 * Test runner callbacks for security patterns
 *
 * These functions should be called with your test runner's describe and test functions.
 *
 * @example
 * ```typescript
 * import { describeSecurityTests } from '@oxlayer/capabilities-testing/patterns/security';
 *
 * describeSecurityTests({
 *   createUseCase: () => new CreateTodoUseCase(...),
 *   executeUseCase: (useCase, input) => useCase.execute(input),
 *   getInput: (maliciousTitle) => ({ title: maliciousTitle, userId: 'test-user' }),
 *   assertSanitized: (result) => {
 *     expect(result.success).toBe(true);
 *     expect(result.data.title).not.toContain('<script>');
 *   }
 * });
 * ```
 */
export function describeSecurityTests<TInput, TOutput>(
  _options: SecurityTestPatternOptions<TInput, TOutput>
): void {
  // Note: This is a template function. In your test files, you'll use the patterns
  // directly with your test framework (Vitest, Jest, etc.).
  //
  // Example implementation in your test file:
  //
  // import { XSS_PATTERNS, SQL_INJECTION_PATTERNS } from '@oxlayer/capabilities-testing/patterns/security';
  //
  // describe('Security Tests', () => {
  //   describe('XSS Prevention', () => {
  //     test.each(XSS_PATTERNS)('should sanitize $description', async ({ input }) => {
  //       const useCase = createUseCase();
  //       const testInput = getInput(input);
  //       const result = await executeUseCase(useCase, testInput);
  //       assertSanitized(result);
  //     });
  //   });
  // });
  throw new Error(
    'describeSecurityTests is a template function. ' +
    'Import the patterns (XSS_PATTERNS, etc.) and write tests using your test framework directly.'
  );
}

/**
 * Validation test options
 */
export interface ValidationTestOptions<TInput, TOutput> {
  /**
   * Factory function to create the use case
   */
  createUseCase: () => unknown;

  /**
   * Execute the use case with the given input
   */
  executeUseCase: (useCase: unknown, input: TInput) => Promise<AppResult<TOutput>>;

  /**
   * Create input with a potentially malicious value
   */
  getInput: (maliciousValue: string) => TInput;

  /**
   * Assert that the output was sanitized correctly (for valid input)
   */
  assertSanitized: (result: AppResult<TOutput>) => void;

  /**
   * Assert that the result was rejected (for invalid input)
   */
  assertRejected: (result: AppResult<TOutput>) => void;

  /**
   * Field name being tested (for error messages)
   */
  fieldName?: string;
}

/**
 * Create input validation tests
 *
 * @example
 * ```typescript
 * import { createValidationTests } from '@oxlayer/capabilities-testing/patterns/security';
 *
 * createValidationTests({
 *   createUseCase: () => new CreateTodoUseCase(...),
 *   executeUseCase: (useCase, input) => useCase.execute(input),
 *   getInput: (title) => ({ title, userId: 'test-user' }),
 *   assertSanitized: (result) => expect(result.success).toBe(true),
 *   assertRejected: (result) => expect(result.success).toBe(false),
 *   fieldName: 'title'
 * });
 * ```
 */
export function createValidationTests<TInput, TOutput>(
  _options: ValidationTestOptions<TInput, TOutput>
): void {
  // Note: This is a template function. In your test files, you'll use the patterns
  // directly with your test framework.
  throw new Error(
    'createValidationTests is a template function. ' +
    'Write validation tests using your test framework directly.'
  );
}

/**
 * Helper function to run all security patterns against a use case
 *
 * @example
 * ```typescript
 * import { testAllSecurityPatterns } from '@oxlayer/capabilities-testing/patterns/security';
 *
 * await testAllSecurityPatterns({
 *   createUseCase: () => new CreateTodoUseCase(...),
 *   executeUseCase: (useCase, input) => useCase.execute(input),
 *   getInput: (maliciousTitle) => ({ title: maliciousTitle, userId: 'test-user' }),
 *   assertSanitized: (result) => {
 *     expect(result.success).toBe(true);
 *     expect(result.data.title).not.toContain('<script>');
 *   }
 * });
 * ```
 */
export async function testAllSecurityPatterns<TInput, TOutput>(
  options: SecurityTestPatternOptions<TInput, TOutput>
): Promise<void> {
  const allPatterns = [
    ...XSS_PATTERNS,
    ...SQL_INJECTION_PATTERNS,
    ...NOSQL_INJECTION_PATTERNS,
    ...PATH_TRAVERSAL_PATTERNS,
    ...COMMAND_INJECTION_PATTERNS,
  ];

  for (const pattern of allPatterns) {
    const useCase = options.createUseCase();
    const testInput = options.getInput(pattern.input);
    const result = await options.executeUseCase(useCase, testInput);
    options.assertSanitized(result);
  }
}
