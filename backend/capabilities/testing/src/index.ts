/**
 * @oxlayer/capabilities-testing
 *
 * Shared testing infrastructure for OxLayer applications.
 *
 * @example
 * ```typescript
 * // Import all testing utilities
 * import {
 *   MockTracer,
 *   MockEventBus,
 *   MockDomainEventEmitter,
 *   MockBusinessMetricEmitter,
 *   MockRepository,
 *   TestBuilder,
 *   waitFor,
 *   retry,
 *   assertEventPublished
 * } from '@oxlayer/capabilities-testing';
 * ```
 */

// Mock Tracer
export {
  MockTracer,
  createMockTracer,
  mockTracer,
  type SpanKind,
  type SpanStatus,
  type SpanContext,
  type MockSpan,
  type MockSpanOptions,
} from './mock-tracer.js';

// Mock Event Bus
export {
  MockEventBus,
  createMockEventBus,
  type PublishedEvent,
} from './mock-event-bus.js';

// Mock Emitters
export {
  MockDomainEventEmitter,
  MockBusinessMetricEmitter,
  createMockDomainEventEmitter,
  createMockBusinessMetricEmitter,
  type DomainEventRecord,
  type BusinessMetricRecord,
} from './mock-emitters.js';

// Mock Repository
export {
  MockRepository,
  createMockRepository,
  type MockRepositoryOptions,
  type MockRepositoryFilters,
} from './mock-repository.js';

// Builders
export {
  TestBuilder,
  DateBuilder,
  IdBuilder,
  StatusBuilder,
  CombinedBuilder,
  createTestBuilder,
  createCombinedBuilder,
  type BuilderValue,
} from './builders.js';

// Test Helpers
export {
  waitFor,
  retry,
  delay,
  timeout,
  timeoutError,
  measureTime,
  concurrent,
  createTestContext,
  createSpy,
  stubMethod,
  type WaitForOptions,
  type RetryOptions,
} from './test-helpers.js';

// Assertions
export {
  assertEventPublished,
  assertEventNotPublished,
  assertEventPublishedWith,
  assertDomainEventEmitted,
  assertMetricRecorded,
  assertCounterValue,
  assertGaugeValue,
  assertDeepEqual,
  assertInstanceOf,
  assertThrows,
  assertRejects,
} from './assertions.js';

// Re-export patterns for convenience
export type { AppResult as SecurityAppResult, SecurityTestPatternOptions, ValidationTestOptions, SecurityPattern } from './patterns/security.js';
export {
  describeSecurityTests,
  createValidationTests,
  testAllSecurityPatterns,
  XSS_PATTERNS,
  SQL_INJECTION_PATTERNS,
  NOSQL_INJECTION_PATTERNS,
  PATH_TRAVERSAL_PATTERNS,
  COMMAND_INJECTION_PATTERNS,
  DOS_PATTERNS,
} from './patterns/security.js';

export type { AppResult as AuthAppResult, OwnershipTestOptions, PermissionTestOptions, CrossUserAccessTestOptions, DataFilteringTestOptions } from './patterns/authorization.js';
export {
  describeOwnershipTests,
  describePermissionTests,
  describeCrossUserAccessTests,
  describeDataFilteringTests,
} from './patterns/authorization.js';

export type { AppResult as ConcurrencyAppResult, RaceConditionTestOptions, IdempotencyTestOptions, StressTestOptions, FaultToleranceTestOptions } from './patterns/concurrency.js';
export {
  describeRaceConditionTests,
  describeIdempotencyTests,
  describeStressTests,
  describeFaultToleranceTests,
} from './patterns/concurrency.js';

export type { AppResult as ErrorAppResult, ErrorHandlingTestOptions, RetryTestOptions } from './patterns/errors.js';
export {
  describeErrorHandlingTests,
  createFaultyRepository,
  createTimeoutPromise,
  describeRetryTests,
} from './patterns/errors.js';
