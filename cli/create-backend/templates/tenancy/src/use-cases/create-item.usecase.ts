/**
 * Create Item Use Case - Tenant Aware
 *
 * Creates items automatically scoped to the current tenant context.
 */

import { CreateUseCaseTemplate } from '@oxlayer/foundation-domain-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';
import { ItemTemplate } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';
import { ItemCreatedEvent } from '../domain/events.js';
import { requireTenantId } from '../middleware/tenant.context.js';

export class CreateItemUseCase extends CreateUseCaseTemplate<ItemTemplate, ItemRepository, ItemCreatedEvent> {
  constructor(repository: ItemRepository) {
    super(repository);
  }

  /**
   * Execute with tenant context
   * The tenant ID is automatically injected from the request context
   */
  async execute(input: {
    name: string;
    description: string;
    quantity: number;
  }): Promise<ItemTemplate> {
    // Get tenant ID from context (injected by middleware)
    const tenantId = requireTenantId();

    // Create entity with tenant ID
    const item = new ItemTemplate({
      id: crypto.randomUUID() as UUID,
      tenantId,
      name: input.name,
      description: input.description,
      quantity: input.quantity as any, // positiveNumber type
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return super.execute(item);
  }

  protected createEvent(item: ItemTemplate): ItemCreatedEvent {
    return new ItemCreatedEvent(item);
  }
}
