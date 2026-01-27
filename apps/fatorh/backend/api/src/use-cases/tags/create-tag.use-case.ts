/**
 * Create Tag Use Case
 *
 * Business logic for creating a new tag.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITagRepository } from '../../repositories/tags/tag.repository.interface.js';

export interface CreateTagUseCaseInput {
  workspaceId: string;
  key: string;
  value: string;
  isPrimary?: boolean;
  description?: string;
  color?: string;
}

export interface CreateTagUseCaseOutput {
  tagId: string;
}

/**
 * Create Tag Use Case
 */
export class CreateTagUseCase {
  constructor(
    private tagRepository: ITagRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateTagUseCaseInput): Promise<CreateTagUseCaseOutput> {
    // Validate input
    this.validate(input);

    // Check if tag already exists
    const existing = await this.tagRepository.findByWorkspaceKeyAndValue(
      input.workspaceId,
      input.key,
      input.value
    );
    if (existing) {
      throw new Error('Tag with this key and value already exists');
    }

    // Import Tag entity here to avoid circular dependency
    const { Tag } = await import('../../domain/tags/index.js');

    // Create tag
    const tag = Tag.create({
      id: generateId(),
      workspaceId: input.workspaceId,
      key: input.key,
      value: input.value,
      isPrimary: input.isPrimary,
      description: input.description,
      color: input.color,
    });

    // Save to database
    await this.tagRepository.create(tag);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'tag.created',
      {
        tagId: tag.id,
        key: tag.key,
        value: tag.value,
        workspaceId: tag.workspaceId,
        createdAt: new Date().toISOString(),
      }
    );

    return {
      tagId: tag.id,
    };
  }

  /**
   * Validate input
   */
  private validate(input: CreateTagUseCaseInput): void {
    if (!input.key || input.key.trim().length === 0) {
      throw new Error('Tag key is required');
    }

    if (input.key.length > 100) {
      throw new Error('Tag key must be less than 100 characters');
    }

    if (!input.value || input.value.trim().length === 0) {
      throw new Error('Tag value is required');
    }

    if (input.value.length > 255) {
      throw new Error('Tag value must be less than 255 characters');
    }

    if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
      throw new Error('Tag color must be a valid hex color code');
    }
  }
}
