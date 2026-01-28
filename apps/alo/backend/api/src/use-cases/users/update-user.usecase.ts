/**
 * Update User Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { UserRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { UserEntity } from '@/domain/index.js';

export interface UpdateUserInput {
  name?: string;
  password?: string;
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  isActive?: boolean;
}

export interface UpdateUserOutput {
  id: number;
  name: string;
  updatedAt: Date;
}

export class UpdateUserUseCase extends UpdateUseCaseTemplate<
  { id: string; input: UpdateUserInput },
  UserEntity,
  AppResult<UpdateUserOutput & Record<string, unknown>>
> {
  constructor(
    private userRepository: UserRepository,
    eventBus: EventBus,
    _domainEvents: any,
    businessMetrics: any,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await userRepository.findById(Number(id));
      },
      updateEntity: async (entity, { input }) => {
        // Apply updates
        if (input.name !== undefined) entity.name = input.name;
        if (input.password !== undefined) entity.passwordHash = input.password; // Should be hashed before passing
        if (input.establishmentId !== undefined) entity.establishmentId = input.establishmentId;
        if (input.role !== undefined) entity.role = input.role;
        if (input.isActive !== undefined) entity.isActive = input.isActive;
      },
      persistEntity: async (_entity) => {
        // Database update is handled separately
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      recordMetric: async (name, value) => {
        try {
          await businessMetrics?.recordMetric(name, value);
        } catch (error) {
          console.warn('Failed to record metric:', error);
        }
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }
}
