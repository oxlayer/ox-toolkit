/**
 * List Tags Use Case
 *
 * Business logic for listing tags with filters.
 */

import type { ITagRepository } from '../../repositories/tags/tag.repository.interface.js';

export interface ListTagsUseCaseInput {
  workspaceId?: string;
  key?: string;
  value?: string;
  isPrimary?: boolean;
}

export interface ListTagsUseCaseOutput {
  tags: Array<{
    id: string;
    workspaceId: string;
    key: string;
    value: string;
    isPrimary: boolean;
    description: string | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * List Tags Use Case
 */
export class ListTagsUseCase {
  constructor(private tagRepository: ITagRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: ListTagsUseCaseInput): Promise<ListTagsUseCaseOutput> {
    const tags = await this.tagRepository.find({
      workspaceId: input.workspaceId,
      key: input.key,
      value: input.value,
      isPrimary: input.isPrimary,
    });

    return {
      tags: tags.map((tag) => ({
        id: tag.id,
        workspaceId: tag.workspaceId,
        key: tag.key,
        value: tag.value,
        isPrimary: tag.isPrimary,
        description: tag.description,
        color: tag.color,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })),
    };
  }
}
