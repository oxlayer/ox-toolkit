/**
 * List Users Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { UserRepository, UserFilters } from '@/repositories/index.js';
import { UserEntity } from '@/domain/index.js';

export interface ListUsersFilters {
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListUsersOutput {
  items: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    establishmentId: number | null;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
}

export class ListUsersUseCase extends ListUseCaseTemplate<
  ListUsersFilters,
  UserEntity,
  Promise<ListUsersOutput>
> {
  constructor(
    private userRepository: UserRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        return await userRepository.findAll(filters);
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
          establishmentId: e.establishmentId,
          isActive: e.isActive,
          createdAt: e.createdAt,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }

  async execute(filters?: ListUsersFilters): Promise<ListUsersOutput> {
    const parsedFilters: UserFilters = {
      establishmentId: filters?.establishmentId,
      role: filters?.role,
      isActive: filters?.isActive,
      search: filters?.search,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
    return super.execute(parsedFilters);
  }
}
