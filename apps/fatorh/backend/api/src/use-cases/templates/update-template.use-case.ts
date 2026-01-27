/**
 * Update Template Use Case
 *
 * Business logic for updating a template.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface UpdateTemplateUseCaseInput {
  id: string;
  name?: string;
  type?: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  body?: string;
  variables?: string[];
  category?: string;
  language?: string;
  isActive?: boolean;
  externalId?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface UpdateTemplateUseCaseOutput {
  template: {
    id: string;
    workspaceId: string;
    name: string;
    type: string;
    subject: string | null;
    body: string;
    variables: string[] | null;
    category: string | null;
    language: string;
    isActive: boolean;
    externalId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Update Template Use Case
 */
export class UpdateTemplateUseCase {
  constructor(
    private templateRepository: ITemplateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateTemplateUseCaseInput): Promise<UpdateTemplateUseCaseOutput> {
    // Validate input
    this.validate(input);

    // Check if template exists
    const existing = await this.templateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Template not found');
    }

    // Update template
    const template = await this.templateRepository.update(input.id, {
      name: input.name,
      type: input.type,
      subject: input.subject,
      body: input.body,
      variables: input.variables,
      category: input.category,
      language: input.language,
      isActive: input.isActive,
      externalId: input.externalId,
      status: input.status,
    });

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'template.updated',
      {
        templateId: template.id,
        name: template.name,
        type: template.type,
        workspaceId: template.workspaceId,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      template: {
        id: template.id,
        workspaceId: template.workspaceId,
        name: template.name,
        type: template.type,
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        category: template.category,
        language: template.language,
        isActive: template.isActive,
        externalId: template.externalId,
        status: template.status,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    };
  }

  /**
   * Validate input
   */
  private validate(input: UpdateTemplateUseCaseInput): void {
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new Error('Template name cannot be empty');
      }
      if (input.name.length > 255) {
        throw new Error('Template name must be less than 255 characters');
      }
    }

    if (input.body !== undefined && input.body.trim().length === 0) {
      throw new Error('Template body cannot be empty');
    }

    if (input.type && !['whatsapp', 'email', 'sms'].includes(input.type)) {
      throw new Error('Template type must be one of: whatsapp, email, sms');
    }
  }
}
