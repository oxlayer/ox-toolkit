/**
 * List Users Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { UserRepository, UserFilters } from '@/repositories/index.js';
import { UserEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListUsersOutput {
  id: number;
  name: string;
  email: string;
  role: string;
  establishmentId: number | null;
  isActive: boolean;
  createdAt: Date;
}

export class ListUsersUseCase extends ListUseCaseTemplate<
  UserFilters,
  UserEntity,
  AppResult<{ items: ListUsersOutput[]; total: number }>
> {
  constructor(
    private userRepository: UserRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await userRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await userRepository.count(filters);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        role: entity.role,
        establishmentId: entity.establishmentId,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListUsers';
  }
}
