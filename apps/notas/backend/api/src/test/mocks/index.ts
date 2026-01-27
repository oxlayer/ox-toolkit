/**
 * Test mocks exports
 *
 * Re-exports testing infrastructure from @oxlayer/capabilities-testing
 * and app-specific mocks.
 */

// Re-export from capabilities-testing
export { MockEventBus } from '@oxlayer/capabilities-testing';
export { MockDomainEventEmitter, MockBusinessMetricEmitter } from '@oxlayer/capabilities-testing/mock-emitters';
export { MockTracer } from '@oxlayer/capabilities-testing/mock-tracer';

// App-specific mocks (not shared)
export * from './mock-todo-repository.js';
