/**
 * Update User Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
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
  { id: number; input: UpdateUserInput },
  UserEntity,
  Promise<UpdateUserOutput>
> {
  constructor(
    private userRepository: UserRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await userRepository.findById(id);
      },
      updateEntity: async (id, input) => {
        const entity = await userRepository.findById(id);
        if (!entity) {
          throw new Error('User not found');
        }

        // Apply updates
        if (input.name !== undefined) entity.name = input.name;
        if (input.password !== undefined) entity.passwordHash = input.password; // Should be hashed before passing
        if (input.establishmentId !== undefined) entity.establishmentId = input.establishmentId;
        if (input.role !== undefined) entity.role = input.role;
        if (input.isActive !== undefined) entity.isActive = input.isActive;

        return await userRepository.update(id, entity);
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
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
