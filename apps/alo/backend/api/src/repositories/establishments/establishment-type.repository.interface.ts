/**
 * Establishment Type Repository Interface
 */

import { EstablishmentTypeEntity } from '@/domain/index.js';

export interface EstablishmentTypeRepository {
  create(entity: EstablishmentTypeEntity): Promise<EstablishmentTypeEntity>;
  findById(id: number): Promise<EstablishmentTypeEntity | null>;
  findAll(): Promise<EstablishmentTypeEntity[]>;
  update(id: number, entity: Partial<EstablishmentTypeEntity>): Promise<EstablishmentTypeEntity>;
  delete(id: number): Promise<void>;
}
