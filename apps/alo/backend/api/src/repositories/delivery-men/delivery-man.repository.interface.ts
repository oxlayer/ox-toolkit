/**
 * Delivery Men Repository
 */

import { DeliveryManEntity } from '@/domain/index.js';

export interface DeliveryManFilters {
  establishmentId?: number;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DeliveryManRepository {
  create(entity: DeliveryManEntity): Promise<DeliveryManEntity>;
  findById(id: number): Promise<DeliveryManEntity | null>;
  findByEmail(email: string): Promise<DeliveryManEntity | null>;
  findAll(filters?: DeliveryManFilters): Promise<{ data: DeliveryManEntity[]; total: number }>;
  update(id: number, entity: Partial<DeliveryManEntity>): Promise<DeliveryManEntity>;
  delete(id: number): Promise<void>;
}
