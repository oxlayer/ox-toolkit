/**
 * Delete Template Use Case
 *
 * Business logic for deleting a template.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface DeleteTemplateUseCaseInput {
  id: string;
}

export interface DeleteTemplateUseCaseOutput {
  success: boolean;
}

/**
 * Delete Template Use Case
 */
export class DeleteTemplateUseCase {
  constructor(
    private templateRepository: ITemplateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteTemplateUseCaseInput): Promise<DeleteTemplateUseCaseOutput> {
    // Check if template exists
    const template = await this.templateRepository.findById(input.id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Delete template
    await this.templateRepository.delete(input.id);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'template.deleted',
      {
        templateId: template.id,
        name: template.name,
        type: template.type,
        workspaceId: template.workspaceId,
        deletedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
    };
  }
}
