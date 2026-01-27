/**
 * Delete User Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { UserRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { UserEntity } from '@/domain/index.js';

export class DeleteUserUseCase extends DeleteUseCaseTemplate<
  number,
  UserEntity,
  Promise<void>
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
      deleteEntity: async (id) => {
        await userRepository.delete(id);
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      tracer,
    });
  }
}
