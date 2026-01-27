/**
 * Create WhatsApp Campaign Use Case
 *
 * Business logic for creating a new WhatsApp campaign.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { IWhatsAppCampaignRepository } from '../../repositories/campaigns/whatsapp-campaign.repository.interface.js';
import type { ITemplateRepository } from '../../repositories/templates/template.repository.interface.js';

export interface CreateWhatsAppCampaignUseCaseInput {
  workspaceId: string;
  examId?: string;
  templateId: string;
  name: string;
  description?: string;
  scheduledAt?: Date;
  tags?: string[];
}

export interface CreateWhatsAppCampaignUseCaseOutput {
  campaignId: string;
}

/**
 * Create WhatsApp Campaign Use Case
 */
export class CreateWhatsAppCampaignUseCase {
  constructor(
    private campaignRepository: IWhatsAppCampaignRepository,
    private templateRepository: ITemplateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateWhatsAppCampaignUseCaseInput): Promise<CreateWhatsAppCampaignUseCaseOutput> {
    // Validate input
    await this.validate(input);

    // Import WhatsAppCampaign entity here to avoid circular dependency
    const { WhatsAppCampaign } = await import('../../domain/campaigns/index.js');

    // Create campaign
    const campaign = WhatsAppCampaign.create({
      id: generateId(),
      workspaceId: input.workspaceId,
      examId: input.examId,
      templateId: input.templateId,
      name: input.name,
      description: input.description,
      scheduledAt: input.scheduledAt,
      tags: input.tags,
    });

    // Save to database
    await this.campaignRepository.create(campaign);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'whatsapp_campaign.created',
      {
        campaignId: campaign.id,
        name: campaign.name,
        templateId: campaign.templateId,
        workspaceId: campaign.workspaceId,
        scheduledAt: campaign.scheduledAt?.toISOString(),
        createdAt: new Date().toISOString(),
      }
    );

    return {
      campaignId: campaign.id,
    };
  }

  /**
   * Validate input
   */
  private async validate(input: CreateWhatsAppCampaignUseCaseInput): Promise<void> {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Campaign name is required');
    }

    if (input.name.length > 255) {
      throw new Error('Campaign name must be less than 255 characters');
    }

    if (!input.templateId) {
      throw new Error('Template ID is required');
    }

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
