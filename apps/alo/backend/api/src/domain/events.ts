/**
 * Domain Events
 */

import { DomainEventTemplate } from '@oxlayer/snippets/domain';

/**
 * Establishment Events
 */
export abstract class EstablishmentEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'Establishment';
  readonly version = 1;

  get eventType(): string {
    return this.name;
  }
}

export class EstablishmentCreatedEvent extends EstablishmentEvent<{ ownerId: number; name: string }> {
  readonly name = 'EstablishmentCreated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { ownerId: number; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class EstablishmentUpdatedEvent extends EstablishmentEvent<{ id: number; name: string }> {
  readonly name = 'EstablishmentUpdated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class EstablishmentDeletedEvent extends EstablishmentEvent<{ id: number; name: string }> {
  readonly name = 'EstablishmentDeleted';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; name: string }
  ) {
    super(aggregateId, payload);
  }
}

/**
 * User Events
 */
export abstract class UserEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'User';
  readonly version = 1;

  get eventType(): string {
    return this.name;
  }
}

export class UserCreatedEvent extends UserEvent<{ email: string; name: string }> {
  readonly name = 'UserCreated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { email: string; name: string }
  ) {
    super(aggregateId, payload);
  }
}

/**
 * Onboarding Lead Events
 */
export abstract class OnboardingLeadEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'OnboardingLead';
  readonly version = 1;

  get eventType(): string {
    return this.name;
  }
}

export class OnboardingLeadCreatedEvent extends OnboardingLeadEvent<{
  userType: string;
  email: string | null;
  phone: string;
}> {
  readonly name = 'OnboardingLeadCreated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { userType: string; email: string | null; phone: string }
  ) {
    super(aggregateId, payload);
  }
}

export class OnboardingLeadStatusChangedEvent extends OnboardingLeadEvent<{
  status: string;
  previousStatus: string;
}> {
  readonly name = 'OnboardingLeadStatusChanged';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { status: string; previousStatus: string }
  ) {
    super(aggregateId, payload);
  }
}

export class OnboardingLeadDeletedEvent extends OnboardingLeadEvent<{ id: number; email: string }> {
  readonly name = 'OnboardingLeadDeleted';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; email: string }
  ) {
    super(aggregateId, payload);
  }
}

/**
 * Delivery Man Events
 */
export abstract class DeliveryManEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'DeliveryMan';
  readonly version = 1;

  get eventType(): string {
    return this.name;
  }
}

export class DeliveryManCreatedEvent extends DeliveryManEvent<{ email: string; name: string }> {
  readonly name = 'DeliveryManCreated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { email: string; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class DeliveryManUpdatedEvent extends DeliveryManEvent<{ id: number; name: string }> {
  readonly name = 'DeliveryManUpdated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class DeliveryManDeletedEvent extends DeliveryManEvent<{ id: number; email: string }> {
  readonly name = 'DeliveryManDeleted';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; email: string }
  ) {
    super(aggregateId, payload);
  }
}

/**
 * Service Provider Events
 */
export abstract class ServiceProviderEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'ServiceProvider';
  readonly version = 1;

  get eventType(): string {
    return this.name;
  }
}

export class ServiceProviderCreatedEvent extends ServiceProviderEvent<{ email: string; name: string }> {
  readonly name = 'ServiceProviderCreated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { email: string; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class ServiceProviderUpdatedEvent extends ServiceProviderEvent<{ id: number; name: string }> {
  readonly name = 'ServiceProviderUpdated';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; name: string }
  ) {
    super(aggregateId, payload);
  }
}

export class ServiceProviderDeletedEvent extends ServiceProviderEvent<{ id: number; email: string }> {
  readonly name = 'ServiceProviderDeleted';

  constructor(
    public readonly aggregateId: number,
    public readonly payload: { id: number; email: string }
  ) {
    super(aggregateId, payload);
  }
}
