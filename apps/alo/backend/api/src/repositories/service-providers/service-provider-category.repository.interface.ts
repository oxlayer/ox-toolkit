/**
 * Service Provider Categories Repository
 */

import { ServiceProviderCategoryEntity } from '@/domain/index.js';

export interface ServiceProviderCategoryFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ServiceProviderCategoryRepository {
  create(entity: ServiceProviderCategoryEntity): Promise<ServiceProviderCategoryEntity>;
  findById(id: number): Promise<ServiceProviderCategoryEntity | null>;
  findAll(filters?: ServiceProviderCategoryFilters): Promise<ServiceProviderCategoryEntity[]>;
  count(filters?: ServiceProviderCategoryFilters): Promise<number>;
  update(id: number, entity: Partial<ServiceProviderCategoryEntity>): Promise<ServiceProviderCategoryEntity>;
  delete(id: number): Promise<void>;
}
