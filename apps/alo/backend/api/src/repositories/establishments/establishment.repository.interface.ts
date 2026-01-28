/**
 * Establishment Repository Interface
 */

import { EstablishmentEntity } from '@/domain/index.js';

export interface EstablishmentFilters {
  ownerId?: number;
  establishmentTypeId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EstablishmentRepository {
  create(entity: EstablishmentEntity): Promise<EstablishmentEntity>;
  findById(id: number): Promise<EstablishmentEntity | null>;
  findAll(filters?: EstablishmentFilters): Promise<EstablishmentEntity[]>;
  count(filters?: EstablishmentFilters): Promise<number>;
  update(id: number, entity: Partial<EstablishmentEntity>): Promise<EstablishmentEntity>;
  delete(id: number): Promise<void>;
}
