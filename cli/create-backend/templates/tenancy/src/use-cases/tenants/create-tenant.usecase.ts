/**
 * Create Tenant Use Case
 *
 * Creates new tenants in the multi-tenant system.
 */

import { CreateUseCaseTemplate } from '@oxlayer/foundation-domain-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';
import { TenantTemplate, TenantStatus } from '../../domain/tenant.js';
import { TenantRepository } from '../../repositories/tenant.repository.js';
import { TenantCreatedEvent } from '../../domain/events.js';

export class CreateTenantUseCase extends CreateUseCaseTemplate<TenantTemplate, TenantRepository, TenantCreatedEvent> {
  constructor(repository: TenantRepository) {
    super(repository);
  }

  /**
   * Execute tenant creation
   */
  async execute(input: {
    name: string;
    domain: string;
    maxUsers: number;
    maxStorageGB: number;
  }): Promise<TenantTemplate> {
    // Check if domain already exists
    const existing = await this.repository.findByDomain(input.domain);
    if (existing) {
      throw new Error(`Tenant with domain "${input.domain}" already exists`);
    }

    const tenant = new TenantTemplate({
      tenantId: crypto.randomUUID() as UUID,
      name: input.name,
      domain: input.domain,
      status: TenantStatus.ACTIVE,
      maxUsers: input.maxUsers as any,
      maxStorageGB: input.maxStorageGB as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return super.execute(tenant);
  }

  protected createEvent(tenant: TenantTemplate): TenantCreatedEvent {
    return new TenantCreatedEvent(tenant);
  }
}
