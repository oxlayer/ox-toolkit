/**
 * Update WhatsApp Campaign Use Case
 *
 * Business logic for updating a WhatsApp campaign.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { IWhatsAppCampaignRepository } from '../../repositories/campaigns/whatsapp-campaign.repository.interface.js';
import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface UpdateWhatsAppCampaignUseCaseInput {
  id: string;
  name?: string;
  description?: string;
  templateId?: string;
  scheduledAt?: Date;
  tags?: string[];
}

export interface UpdateWhatsAppCampaignUseCaseOutput {
  campaign: {
    id: string;
    workspaceId: string;
    examId: string | null;
    templateId: string;
    name: string;
    description: string | null;
    status: string;
    scheduledAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    tags: string[] | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Update WhatsApp Campaign Use Case
 */
export class UpdateWhatsAppCampaignUseCase {
  constructor(
    private campaignRepository: IWhatsAppCampaignRepository,
    private templateRepository: ITemplateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateWhatsAppCampaignUseCaseInput): Promise<UpdateWhatsAppCampaignUseCaseOutput> {
    // Validate input
    await this.validate(input);

    // Check if campaign exists
    const existing = await this.campaignRepository.findById(input.id);
    if (!existing) {
      throw new Error('Campaign not found');
    }

    // Check if campaign can be updated
    if (existing.isFinished()) {
      throw new Error('Cannot update a finished campaign');
    }

    // Update campaign
    const campaign = await this.campaignRepository.update(input.id, {
      name: input.name,
      description: input.description,
      templateId: input.templateId,
      scheduledAt: input.scheduledAt,
      tags: input.tags,
    });

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'whatsapp_campaign.updated',
      {
        campaignId: campaign.id,
        name: campaign.name,
        templateId: campaign.templateId,
        workspaceId: campaign.workspaceId,
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      campaign: {
        id: campaign.id,
        workspaceId: campaign.workspaceId,
        examId: campaign.examId,
        templateId: campaign.templateId,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
        totalRecipients: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        deliveredCount: campaign.deliveredCount,
        failedCount: campaign.failedCount,
        tags: campaign.tags,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
    };
  }

  /**
   * Validate input
   */
  private async validate(input: UpdateWhatsAppCampaignUseCaseInput): Promise<void> {
    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new Error('Campaign name cannot be empty');
      }
      if (input.name.length > 255) {
        throw new Error('Campaign name must be less than 255 characters');
      }
    }

    if (input.templateId) {
      // Check if template exists
      const template = await this.templateRepository.findById(input.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (!template.isReady()) {
        throw new Error('Template is not ready for use (must be active and approved)');
      }
    }
  }
}
