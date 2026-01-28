/**
 * Service Providers Repository
 */

import { ServiceProviderEntity } from '@/domain/index.js';

export interface ServiceProviderFilters {
  categoryId?: number;
  available?: boolean;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ServiceProviderRepository {
  create(entity: ServiceProviderEntity): Promise<ServiceProviderEntity>;
  findById(id: number): Promise<ServiceProviderEntity | null>;
  findByEmail(email: string): Promise<ServiceProviderEntity | null>;
  findAll(filters?: ServiceProviderFilters): Promise<ServiceProviderEntity[]>;
  count(filters?: ServiceProviderFilters): Promise<number>;
  update(id: number, entity: Partial<ServiceProviderEntity>): Promise<ServiceProviderEntity>;
  delete(id: number): Promise<void>;
}
