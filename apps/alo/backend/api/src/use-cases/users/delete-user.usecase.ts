/**
 * Delete User Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { UserRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { UserEntity } from '@/domain/index.js';

export class DeleteUserUseCase extends DeleteUseCaseTemplate<
  { id: string },
  UserEntity,
  AppResult<{ deleted: boolean }>
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
      deleteEntity: async (_id) => {
        // Database delete is handled separately
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
      tracer,
    });
  }
}
