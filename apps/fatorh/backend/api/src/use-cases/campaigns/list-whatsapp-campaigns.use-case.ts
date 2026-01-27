/**
 * List WhatsApp Campaigns Use Case
 *
 * Business logic for listing WhatsApp campaigns with filters.
 */

import type { IWhatsAppCampaignRepository } from '../../repositories/campaigns/whatsapp-campaign.repository.interface.js';

export interface ListWhatsAppCampaignsUseCaseInput {
  workspaceId?: string;
  examId?: string;
  templateId?: string;
  status?: string;
}

export interface ListWhatsAppCampaignsUseCaseOutput {
  campaigns: Array<{
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
  }>;
}

/**
 * List WhatsApp Campaigns Use Case
 */
export class ListWhatsAppCampaignsUseCase {
  constructor(private campaignRepository: IWhatsAppCampaignRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: ListWhatsAppCampaignsUseCaseInput): Promise<ListWhatsAppCampaignsUseCaseOutput> {
    const campaigns = await this.campaignRepository.find({
      workspaceId: input.workspaceId,
      examId: input.examId,
      templateId: input.templateId,
      status: input.status as any,
    });

    return {
      campaigns: campaigns.map((campaign) => ({
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
      })),
    };
  }
}
