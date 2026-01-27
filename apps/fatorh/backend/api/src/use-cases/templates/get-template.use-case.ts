/**
 * Get Template Use Case
 *
 * Business logic for retrieving a template by ID.
 */

import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface GetTemplateUseCaseInput {
  id: string;
}

export interface GetTemplateUseCaseOutput {
  template: {
    id: string;
    workspaceId: string;
    name: string;
    type: string;
    title: string | null;
    subject: string | null;
    content: string;
    body: string;
    variables: string[];
    footer: string | null;
    media: any[];
    buttons: any[];
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
 * Get Template Use Case
 */
export class GetTemplateUseCase {
  constructor(private templateRepository: ITemplateRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: GetTemplateUseCaseInput): Promise<GetTemplateUseCaseOutput> {
    const template = await this.templateRepository.findById(input.id);

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      template: {
        id: template.id,
        workspaceId: template.workspaceId,
        name: template.name,
        type: template.type,
        title: template.subject,
        subject: template.subject,
        content: template.body,
        body: template.body,
        variables: template.variables ?? [],
        footer: null,
        media: [],
        buttons: [],
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
}
