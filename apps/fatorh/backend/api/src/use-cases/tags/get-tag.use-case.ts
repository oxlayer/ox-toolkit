/**
 * Get Tag Use Case
 *
 * Business logic for retrieving a tag by ID.
 */

import type { ITagRepository } from '../../repositories/tags/tag.repository.interface.js';

export interface GetTagUseCaseInput {
  id: string;
}

export interface GetTagUseCaseOutput {
  tag: {
    id: string;
    workspaceId: string;
    key: string;
    value: string;
    isPrimary: boolean;
    description: string | null;
    color: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Get Tag Use Case
 */
export class GetTagUseCase {
  constructor(private tagRepository: ITagRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: GetTagUseCaseInput): Promise<GetTagUseCaseOutput> {
    const tag = await this.tagRepository.findById(input.id);

    if (!tag) {
      throw new Error('Tag not found');
    }

    return {
      tag: {
        id: tag.id,
        workspaceId: tag.workspaceId,
        key: tag.key,
        value: tag.value,
        isPrimary: tag.isPrimary,
        description: tag.description,
        color: tag.color,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
    };
  }
}
