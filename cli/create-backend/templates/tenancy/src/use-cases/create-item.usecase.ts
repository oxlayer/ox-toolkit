/**
 * Create Item Use Case - Tenant Aware
 *
 * This use case extends CreateUseCaseTemplate from @oxlayer/snippets
 * which provides the standard create pattern with tracing.
 *
 * Creates items automatically scoped to the current tenant context.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemTemplate } from '../domain/item.js';
import { CreateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';
import { requireTenantId } from '../middleware/tenant.context.js';

export interface CreateItemInput {
  name: string;
  description: string;
  quantity: number;
}

export interface ItemOutput extends Record<string, unknown> {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Item Use Case - Tenant Aware
 *
 * Extends CreateUseCaseTemplate which provides:
 * - ID generation
 * - Entity creation
 * - Persistence
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 *
 * The tenant ID is automatically injected from the request context.
 */
export class CreateItemUseCase extends CreateUseCaseTemplate<
  CreateItemInput,
  ItemTemplate,
  AppResult<ItemOutput>
> {
  constructor(
    itemRepository: ItemRepository,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => crypto.randomUUID(),
      createEntity: (data) => {
        // Get tenant ID from context (injected by middleware)
        const tenantId = requireTenantId();

        return new ItemTemplate({
          ...data,
          tenantId,
        });
      },
      persistEntity: (entity) => itemRepository.create(entity),
      publishEvent: async (event) => {
        // Publish domain event if needed
        // await itemRepository.publishEvent(event);
      },
      recordMetric: async (name, value) => {
        // Record metric if needed
        // await metricsService.record(name, value);
      },
      toOutput: (entity) => {
        const response = entity.toResponse();
        return {
          id: response.id,
          tenantId: response.tenantId,
          name: response.name,
          description: response.description,
          quantity: response.quantity,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
      },
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'CreateItem';
  }

  protected setSpanAttributes(_span: any, input: CreateItemInput): void {
    // Add custom span attributes if needed
  }

  protected createEvent(entity: ItemTemplate, id: string): unknown {
    return {
      eventType: 'ItemCreated',
      aggregateId: id,
      tenantId: entity.tenantId,
      entity,
    };
  }

  protected getMetricName(action: string): string {
    return `item.${action}`;
  }
}
