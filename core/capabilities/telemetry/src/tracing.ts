/**
 * Tracing utilities for OpenTelemetry span creation
 *
 * Provides helper functions for creating spans with proper semantic conventions
 * following OpenTelemetry specifications for database, messaging, and use case operations.
 *
 * @example
 * ```ts
 * import { withDbSpan, withUseCaseSpan } from '@oxlayer/capabilities-telemetry';
 *
 * // Database span
 * await withDbSpan(tracer, 'select', 'todos', async (span) => {
 *   span?.setAttribute('db.id', id);
 *   return await db.select().from(todos).where(eq(todos.id, id));
 * });
 *
 * // Use case span
 * await withUseCaseSpan(tracer, 'CreateTodo', async (span) => {
 *   span?.setAttribute('user.id', userId);
 *   // ... business logic ...
 * });
 * ```
 */

import { trace, SpanStatusCode, type Span, type Tracer } from '@opentelemetry/api';

// OpenTelemetry Semantic Conventions
// See: https://opentelemetry.io/docs/specs/semconv/
const ATTR_DB_SYSTEM = 'db.system';
const ATTR_DB_NAME = 'db.name';
const ATTR_DB_OPERATION = 'db.operation';
const ATTR_DB_SQL_TABLE = 'db.sql.table';
const ATTR_DB_STATEMENT = 'db.statement';
const ATTR_MESSAGING_SYSTEM = 'messaging.system';
const ATTR_MESSAGING_DESTINATION = 'messaging.destination';
const ATTR_MESSAGING_MESSAGE_ID = 'messaging.message_id';
const ATTR_MESSAGING_EVENT_TYPE = 'messaging.event_type';
const ATTR_MESSAGING_ROUTING_KEY = 'messaging.routing_key';
const ATTR_HTTP_METHOD = 'http.method';
const ATTR_HTTP_URL = 'http.url';
const ATTR_HTTP_TARGET = 'http.target';
const ATTR_NET_HOST_NAME = 'net.host.name';
const ATTR_NET_PEER_PORT = 'net.peer.port';
const ATTR_CODE_NAMESPACE = 'code.namespace';
const ATTR_USE_CASE_NAME = 'use_case.name';

/**
 * Wrap a function in a span with automatic error handling
 *
 * @param tracer - OpenTelemetry Tracer instance (can be null)
 * @param name - Span name
 * @param fn - Function to execute within the span
 * @param attributes - Optional span attributes
 * @returns Result of the function
 *
 * @example
 * ```ts
 * return withSpan(tracer, 'operation.name', async (span) => {
 *   span?.setAttribute('key', 'value');
 *   return await doSomething();
 * }, { 'custom.attribute': 'value' });
 * ```
 */
export async function withSpan<T>(
  tracer: Tracer | null,
  name: string,
  fn: (span: Span) => Promise<T> | T,
  attributes?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  if (!tracer) {
    return fn(null as any);
  }

  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a database span with proper semantic conventions
 *
 * Follows OpenTelemetry database semantic conventions:
 * - db.system: Database system (e.g., "postgresql")
 * - db.name: Database name
 * - db.operation: Operation name (e.g., "select", "insert", "update", "delete")
 * - db.sql.table: Table name
 *
 * @param tracer - OpenTelemetry Tracer instance
 * @param operation - Database operation (select, insert, update, delete)
 * @param table - Table name
 * @param fn - Function to execute within the span
 * @param dbName - Database name (default: "todo_db")
 * @param dbSystem - Database system (default: "postgresql")
 * @returns Result of the function
 *
 * @example
 * ```ts
 * return withDbSpan(tracer, 'select', 'todos', async (span) => {
 *   span?.setAttribute('db.id', todoId);
 *   const [row] = await db.select().from(todos).where(eq(todos.id, todoId));
 *   return row ? mapToEntity(row) : null;
 * });
 * ```
 */
export async function withDbSpan<T>(
  tracer: Tracer | null,
  operation: string,
  table: string,
  fn: (span: Span) => Promise<T> | T,
  dbName: string = 'todo_db',
  dbSystem: string = 'postgresql'
): Promise<T> {
  if (!tracer) {
    return fn(null as any);
  }

  // Create span options with semantic conventions
  // Set attributes on the span options directly rather than on the span during execution
  // to avoid triggering getters on Drizzle query builders during serialization
  const spanOptions = {
    attributes: {
      [ATTR_DB_SYSTEM]: dbSystem,
      [ATTR_DB_NAME]: dbName,
      [ATTR_DB_OPERATION]: operation,
      [ATTR_DB_SQL_TABLE]: table,
    },
  };

  return tracer.startActiveSpan(
    `db.${operation}.${table}`,
    spanOptions,
    (span) => {
      try {
        const result = fn(span);

        // Check if result is a Promise
        if (result instanceof Promise) {
          return result
            .then((value: T) => {
              span.setStatus({ code: SpanStatusCode.OK });
              return value;
            })
            .catch((error: Error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }

        // Sync result
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        span.end();
        throw error;
      }
    }
  );
}

/**
 * Create a messaging span for RabbitMQ operations
 *
 * Follows OpenTelemetry messaging semantic conventions:
 * - messaging.system: "rabbitmq"
 * - messaging.destination: Exchange/queue name
 * - messaging.message_id: Message ID
 *
 * @param tracer - OpenTelemetry Tracer instance
 * @param operation - Operation type ("publish" or "consume")
 * @param destination - Exchange or queue name
 * @param messageId - Optional message ID
 * @param fn - Function to execute within the span
 * @returns Result of the function
 *
 * @example
 * ```ts
 * return withMessagingSpan(tracer, 'publish', 'todo.events', event.eventId, async (span) => {
 *   span?.setAttribute(ATTR_MESSAGING_EVENT_TYPE, event.eventType);
 *   await rabbitMQClient.publish(routingKey, envelope);
 * });
 * ```
 */
export async function withMessagingSpan<T>(
  tracer: Tracer | null,
  operation: 'publish' | 'consume',
  destination: string,
  messageId: string | undefined,
  fn: (span: Span) => Promise<T> | T
): Promise<T> {
  const attributes: Record<string, string | number | boolean | undefined> = {
    [ATTR_MESSAGING_SYSTEM]: 'rabbitmq',
    [ATTR_MESSAGING_DESTINATION]: destination,
  };

  if (messageId) {
    attributes[ATTR_MESSAGING_MESSAGE_ID] = messageId;
  }

  return withSpan(tracer, `messaging.${operation}`, fn, attributes);
}

/**
 * Create a span for external HTTP calls (e.g., ClickHouse)
 *
 * Follows OpenTelemetry HTTP semantic conventions:
 * - http.method: HTTP method
 * - http.url: Full URL
 * - http.target: Path component
 * - net.host.name: Hostname
 * - net.peer.port: Port
 *
 * @param tracer - OpenTelemetry Tracer instance
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Full URL
 * @param fn - Function to execute within the span
 * @returns Result of the function
 *
 * @example
 * ```ts
 * return withHttpSpan(tracer, 'POST', 'http://clickhouse:8123', async (span) => {
 *   span?.setAttribute('clickhouse.operation', 'INSERT');
 *   span?.setAttribute('clickhouse.table', 'domain_events');
 *   return await fetch(url, { method: 'POST', body: data });
 * });
 * ```
 */
export async function withHttpSpan<T>(
  tracer: Tracer | null,
  method: string,
  url: string,
  fn: (span: Span) => Promise<T> | T
): Promise<T> {
  try {
    const parsedUrl = new URL(url);
    const attributes = {
      [ATTR_HTTP_METHOD]: method,
      [ATTR_HTTP_URL]: url,
      [ATTR_HTTP_TARGET]: parsedUrl.pathname,
      [ATTR_NET_HOST_NAME]: parsedUrl.hostname,
      [ATTR_NET_PEER_PORT]:
        parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
    };

    return withSpan(tracer, `http.${method.toLowerCase()}`, fn, attributes);
  } catch {
    // If URL parsing fails, create a simple span
    return withSpan(tracer, `http.${method.toLowerCase()}`, fn, {
      [ATTR_HTTP_METHOD]: method,
      [ATTR_HTTP_URL]: url,
    });
  }
}

/**
 * Create a span for use case execution
 *
 * Use cases represent business logic units in clean architecture.
 * This span helps track the execution flow from HTTP request through
 * business logic to data access.
 *
 * @param tracer - OpenTelemetry Tracer instance
 * @param useCaseName - Name of the use case (e.g., "CreateTodo")
 * @param fn - Function to execute within the span
 * @returns Result of the function
 *
 * @example
 * ```ts
 * return withUseCaseSpan(tracer, 'CreateTodo', async (span) => {
 *   span?.setAttribute('user.id', userId);
 *   span?.setAttribute('todo.title', title);
 *
 *   const todo = Todo.create({ title, userId });
 *   await this.repository.create(todo);
 *
 *   span?.setAttribute('todo.id', todo.id);
 *   return todo;
 * });
 * ```
 */
export async function withUseCaseSpan<T>(
  tracer: Tracer | null,
  useCaseName: string,
  fn: (span: Span) => Promise<T> | T
): Promise<T> {
  const attributes = {
    [ATTR_USE_CASE_NAME]: useCaseName,
    [ATTR_CODE_NAMESPACE]: 'todo.usecases',
  };

  return withSpan(tracer, `usecase.${useCaseName}`, fn, attributes);
}

/**
 * Helper to add routing key attribute to messaging spans
 *
 * @param span - The span to add the attribute to
 * @param routingKey - The routing key value
 */
export function setMessagingRoutingKey(span: Span | null, routingKey: string): void {
  span?.setAttribute(ATTR_MESSAGING_ROUTING_KEY, routingKey);
}

/**
 * Helper to add event type attribute to messaging spans
 *
 * @param span - The span to add the attribute to
 * @param eventType - The event type value
 */
export function setMessagingEventType(span: Span | null, eventType: string): void {
  span?.setAttribute(ATTR_MESSAGING_EVENT_TYPE, eventType);
}

/**
 * Helper to add custom attributes to a span
 *
 * @param span - The span to add attributes to
 * @param attributes - Key-value pairs to add as span attributes
 */
export function setSpanAttributes(
  span: Span | null,
  attributes: Record<string, string | number | boolean | undefined>
): void {
  if (!span) return;

  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      span.setAttribute(key, value);
    }
  }
}

// Re-export semantic convention constants for advanced use
export const SEMCONV = {
  DB_SYSTEM: ATTR_DB_SYSTEM,
  DB_NAME: ATTR_DB_NAME,
  DB_OPERATION: ATTR_DB_OPERATION,
  DB_SQL_TABLE: ATTR_DB_SQL_TABLE,
  DB_STATEMENT: ATTR_DB_STATEMENT,
  MESSAGING_SYSTEM: ATTR_MESSAGING_SYSTEM,
  MESSAGING_DESTINATION: ATTR_MESSAGING_DESTINATION,
  MESSAGING_MESSAGE_ID: ATTR_MESSAGING_MESSAGE_ID,
  MESSAGING_EVENT_TYPE: ATTR_MESSAGING_EVENT_TYPE,
  MESSAGING_ROUTING_KEY: ATTR_MESSAGING_ROUTING_KEY,
  HTTP_METHOD: ATTR_HTTP_METHOD,
  HTTP_URL: ATTR_HTTP_URL,
  HTTP_TARGET: ATTR_HTTP_TARGET,
  NET_HOST_NAME: ATTR_NET_HOST_NAME,
  NET_PEER_PORT: ATTR_NET_PEER_PORT,
  CODE_NAMESPACE: ATTR_CODE_NAMESPACE,
  USE_CASE_NAME: ATTR_USE_CASE_NAME,
};
