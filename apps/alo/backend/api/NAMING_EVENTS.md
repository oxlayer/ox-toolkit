# Domain Event Naming Conventions

This document describes the naming conventions and patterns for domain events in the Alo Manager API.

## Event Naming Pattern

Domain events follow this naming pattern:

```
{Entity}.{Action}
```

### Examples

| Entity | Action | Full Event Name |
|--------|--------|-----------------|
| Establishment | Created | `Establishment.Created` |
| Establishment | Updated | `Establishment.Updated` |
| Establishment | Deleted | `Establishment.Deleted` |
| User | Created | `User.Created` |
| User | Updated | `User.Updated` |
| DeliveryMan | Created | `DeliveryMan.Created` |
| ServiceProvider | Updated | `ServiceProvider.Updated` |
| OnboardingLead | Created | `OnboardingLead.Created` |

## Standard Actions

| Action | Description | Example |
|--------|-------------|---------|
| `Created` | Entity was created | `Establishment.Created` |
| `Updated` | Entity was modified | `User.Updated` |
| `Deleted` | Entity was deleted | `DeliveryMan.Deleted` |
| `Activated` | Entity was activated | `User.Activated` |
| `Deactivated` | Entity was deactivated | `ServiceProvider.Deactivated` |
| `StatusChanged` | Status was changed | `OnboardingLead.StatusChanged` |

## Event Structure

All domain events should include:

### Required Fields

```typescript
interface DomainEvent {
  // Event identification
  eventName: string;        // e.g., "Establishment.Created"
  eventId: string;          // Unique event ID (UUID)
  occurredAt: Date;         // When the event occurred

  // Entity information
  entityType: string;       // e.g., "Establishment"
  entityId: string;         // Entity ID

  // Causation and correlation
  correlationId?: string;   // Correlates related events
  causationId?: string;     // The command that caused this event

  // Event data
  data: Record<string, unknown>;  // Event-specific data
}
```

### Example Event

```typescript
{
  "eventName": "Establishment.Created",
  "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "occurredAt": "2024-01-27T10:30:00Z",
  "entityType": "Establishment",
  "entityId": "123",
  "correlationId": "abc-123-def",
  "causationId": "command-create-establishment-456",
  "data": {
    "name": "My Restaurant",
    "ownerId": 1,
    "establishmentTypeId": 2
  }
}
```

## Event Versioning

When events evolve, use versioning:

```
{Entity}.{Action}.v{Version}
```

Examples:
- `Establishment.Created.v1`
- `Establishment.Created.v2`

### When to Version

- Add new required fields
- Change field types
- Remove existing fields
- Change field semantics

### When NOT to Version

- Add optional fields
- Add metadata
- Performance optimizations

## Event Categories

### Lifecycle Events

Events related to entity lifecycle:
- `{Entity}.Created`
- `{Entity}.Updated`
- `{Entity}.Deleted`

### State Change Events

Events related to entity state changes:
- `{Entity}.Activated`
- `{Entity}.Deactivated`
- `{Entity}.StatusChanged`
- `{Entity}.Suspended`

### Business Events

Events related to business operations:
- `OnboardingLead.Contacted`
- `OnboardingLead.Converted`
- `OnboardingLead.Rejected`
- `DeliveryMan.Assigned`
- `DeliveryMan.Unassigned`

## Implementation Pattern

### Base Event Class

```typescript
export abstract class DomainEventBase {
  readonly eventName: string;
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly entityType: string;
  readonly entityId: string;
  readonly correlationId?: string;
  readonly causationId?: string;

  constructor(data: DomainEventData) {
    this.eventName = data.eventName;
    this.eventId = data.eventId || randomUUID();
    this.occurredAt = data.occurredAt || new Date();
    this.entityType = data.entityType;
    this.entityId = data.entityId;
    this.correlationId = data.correlationId;
    this.causationId = data.causationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      eventId: this.eventId,
      occurredAt: this.occurredAt,
      entityType: this.entityType,
      entityId: this.entityId,
      correlationId: this.correlationId,
      causationId: this.causationId,
    };
  }
}
```

### Concrete Event

```typescript
export class EstablishmentCreatedEvent extends DomainEventBase {
  readonly data: {
    name: string;
    ownerId: number;
    establishmentTypeId?: number;
  };

  constructor(entityId: string, data: EstablishmentCreatedEvent['data'], metadata?: EventMetadata) {
    super({
      eventName: 'Establishment.Created',
      entityType: 'Establishment',
      entityId,
      ...metadata,
    });
    this.data = data;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      data: this.data,
    };
  }
}
```

## Publishing Events

### In Use Cases

```typescript
export class CreateEstablishmentUseCase {
  async execute(input: CreateEstablishmentInput): Promise<Result<Establishment>> {
    // Create establishment
    const establishment = await this.repository.create(input);

    // Publish event
    const event = new EstablishmentCreatedEvent(
      establishment.id.toString(),
      {
        name: establishment.name,
        ownerId: establishment.ownerId,
      },
      {
        correlationId: input.correlationId,
        causationId: `create-establishment-${randomUUID()}`,
      }
    );

    await this.eventBus.publish(event);

    return Result.ok(establishment);
  }
}
```

## Consuming Events

### Event Handlers

```typescript
export class EstablishmentCreatedHandler {
  async handle(event: EstablishmentCreatedEvent): Promise<void> {
    // Handle event
    console.log(`Establishment created: ${event.data.name}`);

    // Trigger side effects
    await this.sendWelcomeEmail(event.data.ownerId);
    await this.notifyAdmins(event);
  }
}
```

## Best Practices

1. **Use Past Tense**: Events are things that have already happened
2 - **Be Specific**: `Establishment.Created` is better than `Entity.Created`
3 - **Immutable**: Events should never be modified after creation
4 - **Serializable**: Events must be serializable to JSON
5 - **No Logic**: Events should only contain data, no business logic
6 - **Timestamp**: Always include when the event occurred
7 - **Correlation**: Correlate events that belong to the same workflow

## Event Storage

Events are stored in ClickHouse for analysis:

```sql
CREATE TABLE IF NOT EXISTS domain_events (
  timestamp DateTime64(9),
  eventName String,
  eventId String,
  entityType String,
  entityId String,
  correlationId String,
  causationId String,
  data String,
  INDEX idx_event_name eventName TYPE bloom_filter GRANULARITY 1,
  INDEX idx_entity entityType, entityId TYPE bloom_filter GRANULARITY 1
)
ENGINE = MergeTree()
ORDER BY (timestamp, eventName);
```

## Event Querying

Example queries for event analysis:

```sql
-- Count events by type
SELECT eventName, count(*) as count
FROM domain_events
WHERE timestamp > now() - INTERVAL 1 DAY
GROUP BY eventName;

-- Get establishment creation timeline
SELECT timestamp, entityId, data:name
FROM domain_events
WHERE eventName = 'Establishment.Created'
ORDER BY timestamp DESC
LIMIT 100;

-- Find related events by correlation
SELECT timestamp, eventName, entityId
FROM domain_events
WHERE correlationId = 'abc-123-def'
ORDER BY timestamp;
```

## Quick Reference

| Pattern | Example | Use Case |
|---------|---------|----------|
| `{Entity}.Created` | `Establishment.Created` | Entity creation |
| `{Entity}.Updated` | `User.Updated` | Entity modification |
| `{Entity}.Deleted` | `DeliveryMan.Deleted` | Entity deletion |
| `{Entity}.{Status}Changed` | `OnboardingLead.StatusChanged` | Status changes |
| `{Entity}.{Action}` | `DeliveryMan.Assigned` | Business actions |
