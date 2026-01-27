/**
 * Get WhatsApp Campaign Use Case
 *
 * Business logic for retrieving a WhatsApp campaign by ID.
 */

import type { IWhatsAppCampaignRepository } from '../../repositories/campaigns/whatsapp-campaign.repository.interface.js';

export interface GetWhatsAppCampaignUseCaseInput {
  id: string;
}

export interface GetWhatsAppCampaignUseCaseOutput {
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
 * Get WhatsApp Campaign Use Case
 */
export class GetWhatsAppCampaignUseCase {
  constructor(private campaignRepository: IWhatsAppCampaignRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: GetWhatsAppCampaignUseCaseInput): Promise<GetWhatsAppCampaignUseCaseOutput> {
    const campaign = await this.campaignRepository.findById(input.id);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

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
}
