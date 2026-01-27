import type { DomainEvent } from './event.js';

/**
 * Event envelope - transport-agnostic event wrapper
 * Contains metadata for tracing, correlation, and versioning
 */
export interface EventEnvelope<T = unknown> {
  // Event metadata
  id: string;
  type: string;
  version: string;
  timestamp: string;
  correlationId?: string;
  causationId?: string;

  // Tracing
  traceId?: string;
  spanId?: string;

  // Source
  source: string;
  sourceVersion?: string;

  // Event data
  data: T;

  // Custom metadata
  metadata?: Record<string, string | number | boolean>;
}

export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  spanId?: string;
  source: string;
  sourceVersion?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Create an event envelope from a domain event
 */
export function createEnvelope<T extends DomainEvent>(
  event: T,
  metadata: EventMetadata
): EventEnvelope<T> {
  // Handle both Date and string types for occurredAt
  const timestamp = event.occurredAt instanceof Date
    ? event.occurredAt.toISOString()
    : event.occurredAt;

  return {
    id: event.eventId,
    type: event.eventType,
    version: '1.0',
    timestamp,
    correlationId: event.correlationId || metadata.correlationId,
    causationId: event.causationId || metadata.causationId,
    traceId: metadata.traceId,
    spanId: metadata.spanId,
    source: metadata.source,
    sourceVersion: metadata.sourceVersion,
    data: event as T,
    metadata: metadata.metadata,
  };
}

/**
 * Extract domain event from envelope
 */
export function extractEvent<T>(envelope: EventEnvelope<T>): T {
  return envelope.data as T;
}
