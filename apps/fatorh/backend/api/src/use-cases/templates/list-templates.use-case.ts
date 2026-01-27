/**
 * List Templates Use Case
 *
 * Business logic for listing templates with filters.
 */

import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface ListTemplatesUseCaseInput {
  workspaceId?: string;
  type?: string;
  category?: string;
  status?: string;
  isActive?: boolean;
}

export interface ListTemplatesUseCaseOutput {
  templates: Array<{
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
  }>;
}

/**
 * List Templates Use Case
 */
export class ListTemplatesUseCase {
  constructor(private templateRepository: ITemplateRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: ListTemplatesUseCaseInput): Promise<ListTemplatesUseCaseOutput> {
    const templates = await this.templateRepository.find({
      workspaceId: input.workspaceId,
      type: input.type as any,
      category: input.category,
      status: input.status as any,
      isActive: input.isActive,
    });

    return {
      templates: templates.map((template) => ({
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
      })),
    };
  }
}
