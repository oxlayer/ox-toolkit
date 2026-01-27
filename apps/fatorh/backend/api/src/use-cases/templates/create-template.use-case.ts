/**
 * Create Template Use Case
 *
 * Business logic for creating a new template.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface CreateTemplateUseCaseInput {
  workspaceId: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  body: string;
  variables?: string[];
  category?: string;
  language?: string;
  isActive?: boolean;
  externalId?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected';
}

export interface CreateTemplateUseCaseOutput {
  templateId: string;
}

/**
 * Create Template Use Case
 */
export class CreateTemplateUseCase {
  constructor(
    private templateRepository: ITemplateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateTemplateUseCaseInput): Promise<CreateTemplateUseCaseOutput> {
    // Validate input
    this.validate(input);

    // Import Template entity here to avoid circular dependency
    const { Template } = await import('../../domain/templates/index.js');

    // Create template
    const template = Template.create({
      id: generateId(),
      workspaceId: input.workspaceId,
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

    // Save to database
    await this.templateRepository.create(template);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'template.created',
      {
        templateId: template.id,
        name: template.name,
        type: template.type,
        workspaceId: template.workspaceId,
        createdAt: new Date().toISOString(),
      }
    );

    return {
      templateId: template.id,
    };
  }

  /**
   * Validate input
   */
  private validate(input: CreateTemplateUseCaseInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (input.name.length > 255) {
      throw new Error('Template name must be less than 255 characters');
    }

    if (!input.body || input.body.trim().length === 0) {
      throw new Error('Template body is required');
    }

    if (!['whatsapp', 'email', 'sms'].includes(input.type)) {
      throw new Error('Template type must be one of: whatsapp, email, sms');
    }

    if (input.type === 'email' && !input.subject) {
      throw new Error('Subject is required for email templates');
    }
  }
}
