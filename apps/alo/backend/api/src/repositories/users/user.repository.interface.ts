/**
 * Users Repository
 */

import { UserEntity } from '@/domain/index.js';

export interface UserFilters {
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserRepository {
  create(entity: UserEntity): Promise<UserEntity>;
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(filters?: UserFilters): Promise<{ data: UserEntity[]; total: number }>;
  update(id: number, entity: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: number): Promise<void>;
}
