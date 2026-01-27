/**
 * Update Tag Use Case
 *
 * Business logic for updating a tag.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITagRepository } from '../../repositories/tags/tag.repository.interface.js';

export interface UpdateTagUseCaseInput {
  id: string;
  key?: string;
  value?: string;
  isPrimary?: boolean;
  description?: string;
  color?: string;
}

export interface UpdateTagUseCaseOutput {
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
 * Update Tag Use Case
 */
export class UpdateTagUseCase {
  constructor(
    private tagRepository: ITagRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateTagUseCaseInput): Promise<UpdateTagUseCaseOutput> {
    // Validate input
    this.validate(input);

    // Check if tag exists
    const existing = await this.tagRepository.findById(input.id);
    if (!existing) {
      throw new Error('Tag not found');
    }

    // Check for duplicate key-value pair if changing
    if (input.key || input.value) {
      const newKey = input.key ?? existing.key;
      const newValue = input.value ?? existing.value;
      const duplicate = await this.tagRepository.findByWorkspaceKeyAndValue(
        existing.workspaceId,
        newKey,
        newValue
      );
      if (duplicate && duplicate.id !== input.id) {
        throw new Error('Tag with this key and value already exists');
      }
    }

    // Update tag
    const tag = await this.tagRepository.update(input.id, {
      key: input.key,
      value: input.value,
      isPrimary: input.isPrimary,
      description: input.description,
      color: input.color,
    });

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'tag.updated',
      {
        tagId: tag.id,
        key: tag.key,
        value: tag.value,
        workspaceId: tag.workspaceId,
        updatedAt: new Date().toISOString(),
      }
    );

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

  /**
   * Validate input
   */
  private validate(input: UpdateTagUseCaseInput): void {
    if (input.key !== undefined) {
      if (input.key.trim().length === 0) {
        throw new Error('Tag key cannot be empty');
      }
      if (input.key.length > 100) {
        throw new Error('Tag key must be less than 100 characters');
      }
    }

    if (input.value !== undefined) {
      if (input.value.trim().length === 0) {
        throw new Error('Tag value cannot be empty');
      }
      if (input.value.length > 255) {
        throw new Error('Tag value must be less than 255 characters');
      }
    }

    if (input.color && !/^#[0-9A-F]{6}$/i.test(input.color)) {
      throw new Error('Tag color must be a valid hex color code');
    }
  }
}
