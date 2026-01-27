/**
 * Unit Tests for Mock ClickHouse Emitters
 *
 * Tests the mock implementations to ensure they work correctly.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MockDomainEventEmitter, MockBusinessMetricEmitter } from '@oxlayer/capabilities-testing/mock-emitters';

describe('MockDomainEventEmitter', () => {
  let emitter: MockDomainEventEmitter;

  beforeEach(() => {
    emitter = new MockDomainEventEmitter();
  });

  it('should emit events', async () => {
    await emitter.emit('test_event', { foo: 'bar' }, { meta: 'data' });

    expect(emitter.wasEventEmitted('test_event')).toBe(true);
    expect(emitter.count('test_event')).toBe(1);
  });

  it('should store event data', async () => {
    await emitter.emit('test_event', { id: 123, name: 'test' });

    const events = emitter.getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventName: 'test_event',
      payload: { id: 123, name: 'test' },
    });
  });

  it('should store metadata', async () => {
    await emitter.emit('test_event', { data: 'value' }, { tenant: 'default', plan: 'free' });

    const events = emitter.getEvents();
    expect(events[0].metadata).toEqual({ tenant: 'default', plan: 'free' });
  });

  it('should emit multiple events', async () => {
    await emitter.emit('event1', { data: 1 });
    await emitter.emit('event2', { data: 2 });
    await emitter.emit('event1', { data: 3 });

    expect(emitter.count('event1')).toBe(2);
    expect(emitter.count('event2')).toBe(1);
  });

  it('should clear events', async () => {
    await emitter.emit('test_event', { data: 'value' });
    expect(emitter.wasEventEmitted('test_event')).toBe(true);

    emitter.clear();
    expect(emitter.wasEventEmitted('test_event')).toBe(false);
    expect(emitter.getEvents()).toHaveLength(0);
  });

  it('should return false for non-emitted events', () => {
    expect(emitter.wasEventEmitted('non_existent')).toBe(false);
    expect(emitter.count('non_existent')).toBe(0);
  });
});

describe('MockBusinessMetricEmitter', () => {
  let emitter: MockBusinessMetricEmitter;

  beforeEach(() => {
    emitter = new MockBusinessMetricEmitter();
  });

  it('should record increment metrics', async () => {
    await emitter.increment('todo.created', { tenant: 'default', plan: 'free' });

    expect(emitter.wasMetricRecorded('todo.created')).toBe(true);
    expect(emitter.count('todo.created')).toBe(1);

    const metrics = emitter.getMetrics();
    expect(metrics[0]).toMatchObject({
      metricName: 'todo.created',
      value: 1,
      kind: 'counter',
      dimensions: { tenant: 'default', plan: 'free' },
    });
  });

  it('should record gauge metrics', async () => {
    await emitter.gauge('queue.size', 42, { service: 'api' });

    expect(emitter.wasMetricRecorded('queue.size')).toBe(true);

    const metrics = emitter.getMetrics();
    expect(metrics[0]).toMatchObject({
      metricName: 'queue.size',
      value: 42,
      kind: 'gauge',
    });
  });

  it('should record histogram metrics', async () => {
    await emitter.record('request.duration', 150, 'histogram', { endpoint: '/api/todos' });

    expect(emitter.wasMetricRecorded('request.duration')).toBe(true);

    const metrics = emitter.getMetrics();
    expect(metrics[0]).toMatchObject({
      metricName: 'request.duration',
      value: 150,
      kind: 'histogram',
    });
  });

  it('should record multiple metrics', async () => {
    await emitter.increment('metric1');
    await emitter.increment('metric2');
    await emitter.increment('metric1');

    expect(emitter.count('metric1')).toBe(2);
    expect(emitter.count('metric2')).toBe(1);
  });

  it('should clear metrics', async () => {
    await emitter.increment('test.metric', { key: 'value' });
    expect(emitter.wasMetricRecorded('test.metric')).toBe(true);

    emitter.clear();
    expect(emitter.wasMetricRecorded('test.metric')).toBe(false);
    expect(emitter.getMetrics()).toHaveLength(0);
  });

  it('should handle increment without dimensions', async () => {
    await emitter.increment('metric.without.dimensions');

    const metrics = emitter.getMetrics();
    expect(metrics[0].dimensions).toBeUndefined();
  });

  it('should handle gauge without dimensions', async () => {
    await emitter.gauge('metric.without.dimensions', 100);

    const metrics = emitter.getMetrics();
    expect(metrics[0].dimensions).toBeUndefined();
  });

  it('should handle record without dimensions', async () => {
    await emitter.record('metric.without.dimensions', 50, 'counter');

    const metrics = emitter.getMetrics();
    expect(metrics[0].dimensions).toBeUndefined();
  });

  it('should return false for non-recorded metrics', () => {
    expect(emitter.wasMetricRecorded('non_existent')).toBe(false);
    expect(emitter.count('non_existent')).toBe(0);
  });
});
