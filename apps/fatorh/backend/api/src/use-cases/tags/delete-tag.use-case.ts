/**
 * Delete Tag Use Case
 *
 * Business logic for deleting a tag.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITagRepository } from '../../repositories/tags/tag.repository.interface.js';

export interface DeleteTagUseCaseInput {
  id: string;
}

export interface DeleteTagUseCaseOutput {
  success: boolean;
}

/**
 * Delete Tag Use Case
 */
export class DeleteTagUseCase {
  constructor(
    private tagRepository: ITagRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteTagUseCaseInput): Promise<DeleteTagUseCaseOutput> {
    // Check if tag exists
    const tag = await this.tagRepository.findById(input.id);
    if (!tag) {
      throw new Error('Tag not found');
    }

    // Delete tag
    await this.tagRepository.delete(input.id);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'tag.deleted',
      {
        tagId: tag.id,
        key: tag.key,
        value: tag.value,
        workspaceId: tag.workspaceId,
        deletedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
    };
  }
}
