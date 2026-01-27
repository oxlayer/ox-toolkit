# @oxlayer/capabilities-testing

Shared testing infrastructure for OxLayer applications.

## Overview

This package provides reusable testing utilities for OxLayer microservices, including:

- **MockTracer** - OpenTelemetry tracer mock for testing without OTEL setup
- **MockEventBus** - In-memory event bus for testing event-driven functionality
- **MockDomainEventEmitter** - Mock for ClickHouse domain events
- **MockBusinessMetricEmitter** - Mock for ClickHouse business metrics
- **Test Helpers** - Common utilities (waitFor, retry, delay, etc.)
- **Assertions** - Custom assertion helpers for common test scenarios

## Installation

```bash
pnpm add -D @oxlayer/capabilities-testing
```

## Usage

### MockTracer

Mock OpenTelemetry tracer for testing without actual OTEL setup:

```typescript
import { MockTracer } from '@oxlayer/capabilities-testing';

const tracer = new MockTracer();

await tracer.startActiveSpan('database.query', { kind: 'CLIENT' }, async (span) => {
  span?.setAttribute('db.system', 'postgresql');
  span?.setAttribute('db.statement', 'SELECT * FROM todos');
  await queryDatabase();
  span?.setStatus({ code: 1 });
});
```

### MockEventBus

In-memory event bus for testing event-driven functionality:

```typescript
import { MockEventBus } from '@oxlayer/capabilities-testing';

const eventBus = new MockEventBus();

// Emit events
await eventBus.emit(new TodoCreatedEvent({
  aggregateId: 'todo-1',
  userId: 'user-1',
  title: 'Test Todo'
}));

// Assert events were published
expect(eventBus.wasPublished('Todo.Created')).toBe(true);
expect(eventBus.count('Todo.Created')).toBe(1);

// Get events for detailed assertions
const events = eventBus.getEvents('Todo.Created');
expect(events[0].event.payload.title).toBe('Test Todo');

// Clear for next test
eventBus.clear();
```

### MockDomainEventEmitter

Mock for ClickHouse domain events:

```typescript
import { MockDomainEventEmitter } from '@oxlayer/capabilities-testing';

const eventEmitter = new MockDomainEventEmitter();

// Emit domain events
await eventEmitter.emit('Todo.Created', {
  aggregateId: 'todo-1',
  userId: 'user-1',
  title: 'Test Todo'
});

// Assert
expect(eventEmitter.wasEventEmitted('Todo.Created')).toBe(true);
expect(eventEmitter.count('Todo.Created')).toBe(1);

// Clear for next test
eventEmitter.clear();
```

### MockBusinessMetricEmitter

Mock for ClickHouse business metrics:

```typescript
import { MockBusinessMetricEmitter } from '@oxlayer/capabilities-testing';

const metricEmitter = new MockBusinessMetricEmitter();

// Record metrics
await metricEmitter.increment('todos.created', { userId: 'user-1' });
await metricEmitter.gauge('todos.active_count', 5);
await metricEmitter.record('todos.duration', 150, 'histogram');

// Assert
expect(metricEmitter.wasMetricRecorded('todos.created')).toBe(true);
expect(metricEmitter.getCounterValue('todos.created')).toBe(1);
expect(metricEmitter.getGaugeValue('todos.active_count')).toBe(5);

// Clear for next test
metricEmitter.clear();
```

### Test Helpers

Common utilities for testing:

```typescript
import { waitFor, retry, delay, measureTime } from '@oxlayer/capabilities-testing';

// Wait for a condition
await waitFor(() => eventBus.wasPublished('Todo.Created'));

// Retry with backoff
const result = await retry(
  () => fetch(url),
  { maxAttempts: 3, initialDelay: 100 }
);

// Delay
await delay(100);

// Measure execution time
const [data, duration] = await measureTime(() => expensiveOperation());
console.log(`Operation took ${duration}ms`);
```

### Assertions

Custom assertion helpers:

```typescript
import {
  assertEventPublished,
  assertMetricRecorded,
  assertThrows,
  assertRejects
} from '@oxlayer/capabilities-testing';

// Assert an event was published
assertEventPublished(eventBus, 'Todo.Created');
assertEventPublished(eventBus, 'Todo.Created', 2); // Exactly 2 times

// Assert a metric was recorded
assertMetricRecorded(metricEmitter, 'todos.created');

// Assert a function throws
assertThrows(() => riskyOperation(), Error, 'Expected error message');

// Assert a promise rejects
await assertRejects(async () => {
  throw new ValidationError('Invalid');
}, ValidationError);
```

## Test Setup Example

Recommended test setup pattern:

```typescript
import { beforeEach, afterEach, describe, it, expect } from 'bun:test';
import { MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter, MockTracer } from '@oxlayer/capabilities-testing';

describe('Todo Use Cases', () => {
  let eventBus: MockEventBus;
  let eventEmitter: MockDomainEventEmitter;
  let metricEmitter: MockBusinessMetricEmitter;
  let tracer: MockTracer;

  beforeEach(() => {
    eventBus = new MockEventBus();
    eventEmitter = new MockDomainEventEmitter();
    metricEmitter = new MockBusinessMetricEmitter();
    tracer = new MockTracer();
  });

  afterEach(() => {
    eventBus.clear();
    eventEmitter.clear();
    metricEmitter.clear();
    tracer.reset();
  });

  it('should create a todo and emit events', async () => {
    const useCase = new CreateTodoUseCase(
      repository,
      eventBus,
      eventEmitter,
      metricEmitter,
      tracer
    );

    const result = await useCase.execute({
      title: 'Test Todo',
      userId: 'user-1'
    });

    expect(result.success).toBe(true);
    assertEventPublished(eventBus, 'Todo.Created');
    assertDomainEventEmitted(eventEmitter, 'Todo.Created');
    assertMetricRecorded(metricEmitter, 'todos.created');
  });
});
```

## API Reference

### MockTracer

- `startActiveSpan(name, options, fn)` - Execute function within span context
- `startSpan(name, options)` - Create a manual span
- `getTracer()` - Get tracer instance (returns self)
- `getSpanCount()` - Get number of spans created
- `reset()` - Reset span counter

### MockEventBus

- `emit(event)` - Emit a domain event
- `emitEnvelope(envelope)` - Emit an event envelope
- `on(eventType, handler)` - Subscribe to events
- `onEnvelope(eventType, handler)` - Subscribe to event envelopes
- `getEvents(eventType)` - Get events by type
- `getAllEvents()` - Get all events
- `clear()` - Clear all events
- `wasPublished(eventType)` - Check if event was published
- `count(eventType)` - Count events by type

### MockDomainEventEmitter

- `emit(eventName, payload, metadata)` - Emit a domain event
- `getEvents()` - Get all events
- `getEventsByName(eventName)` - Get events by name
- `getLastEvent()` - Get most recent event
- `clear()` - Clear all events
- `wasEventEmitted(eventName)` - Check if event was emitted
- `count(eventName)` - Count events by name

### MockBusinessMetricEmitter

- `increment(metricName, dimensions)` - Increment a counter
- `gauge(metricName, value, dimensions)` - Record a gauge
- `record(metricName, value, kind, dimensions)` - Record a metric
- `getMetrics()` - Get all metrics
- `getCounterValue(metricName)` - Get counter value
- `getGaugeValue(metricName)` - Get last gauge value
- `clear()` - Clear all metrics
- `wasMetricRecorded(metricName)` - Check if metric was recorded
- `count(metricName)` - Count metrics by name

### Test Helpers

- `waitFor(condition, options)` - Wait for condition to be true
- `retry(fn, options)` - Retry with exponential backoff
- `delay(ms)` - Delay for specified time
- `timeout(ms, value)` - Promise that resolves after timeout
- `timeoutError(ms, message)` - Promise that rejects after timeout
- `measureTime(fn)` - Measure execution time
- `concurrent(fns)` - Run functions concurrently
- `createSpy(fn)` - Create a spy function
- `stubMethod(obj, method, fn)` - Stub a method

### Assertions

- `assertEventPublished(eventBus, eventType, count?)` - Assert event was published
- `assertEventNotPublished(eventBus, eventType)` - Assert event was NOT published
- `assertDomainEventEmitted(emitter, eventName, count?)` - Assert domain event was emitted
- `assertMetricRecorded(emitter, metricName, count?)` - Assert metric was recorded
- `assertCounterValue(emitter, metricName, value)` - Assert counter value
- `assertGaugeValue(emitter, metricName, value)` - Assert gauge value
- `assertDeepEqual(actual, expected)` - Assert deep equality
- `assertInstanceOf(value, constructor)` - Assert instance type
- `assertThrows(fn, errorType?, message?)` - Assert function throws
- `assertRejects(fn, errorType?, message?)` - Assert promise rejects

## License

MIT
