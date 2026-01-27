/**
 * Mock Event Bus
 *
 * In-memory event bus for testing.
 * Tracks published events for assertions.
 */

export interface PublishedEvent {
  event: unknown;
  timestamp: Date;
}

export class MockEventBus {
  private publishedEvents: Map<string, PublishedEvent[]> = new Map();

  /**
   * Publish an event
   */
  async publish(...args: any[]): Promise<void> {
    // Handle both single event object and (exchange, routingKey, event) signature
    let eventType: string;
    let eventData: any;

    if (args.length === 1) {
      // Single event object with type property
      eventData = args[0];
      eventType = eventData.type || 'unknown';
    } else if (args.length >= 2) {
      // (exchange, routingKey, event) signature
      eventData = args[2] || {};
      eventType = args[1] || 'unknown';
    } else {
      eventType = 'unknown';
      eventData = {};
    }

    if (!this.publishedEvents.has(eventType)) {
      this.publishedEvents.set(eventType, []);
    }

    this.publishedEvents.get(eventType)!.push({
      event: eventData,
      timestamp: new Date(),
    });
  }

  /**
   * Subscribe to an event (no-op for mock)
   */
  async subscribe(
    event: string,
    handler: (event: unknown) => void | Promise<void>
  ): Promise<void> {
    // No-op for mock
  }

  /**
   * Get all published events of a type
   */
  getEvents(eventType: string): PublishedEvent[] {
    return this.publishedEvents.get(eventType) || [];
  }

  /**
   * Get all published events
   */
  getAllEvents(): PublishedEvent[] {
    const all: PublishedEvent[] = [];
    for (const events of this.publishedEvents.values()) {
      all.push(...events);
    }
    return all;
  }

  /**
   * Clear all published events
   */
  clear(): void {
    this.publishedEvents.clear();
  }

  /**
   * Check if an event type was published
   */
  wasPublished(eventType: string): boolean {
    const events = this.publishedEvents.get(eventType);
    return events !== undefined && events.length > 0;
  }

  /**
   * Get count of published events by type
   */
  count(eventType: string): number {
    return this.getEvents(eventType).length;
  }

  /**
   * Disconnect (no-op for mock)
   */
  async disconnect(): Promise<void> {
    // No-op for mock
  }

  /**
   * Check connection status (always true for mock)
   */
  isConnected(): boolean {
    return true;
  }
}
