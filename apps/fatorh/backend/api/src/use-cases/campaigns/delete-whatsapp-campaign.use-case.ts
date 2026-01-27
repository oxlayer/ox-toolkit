/**
 * Delete WhatsApp Campaign Use Case
 *
 * Business logic for deleting a WhatsApp campaign.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { IWhatsAppCampaignRepository } from '../../repositories/campaigns/whatsapp-campaign.repository.interface.js';

export interface DeleteWhatsAppCampaignUseCaseInput {
  id: string;
}

export interface DeleteWhatsAppCampaignUseCaseOutput {
  success: boolean;
}

/**
 * Delete WhatsApp Campaign Use Case
 */
export class DeleteWhatsAppCampaignUseCase {
  constructor(
    private campaignRepository: IWhatsAppCampaignRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteWhatsAppCampaignUseCaseInput): Promise<DeleteWhatsAppCampaignUseCaseOutput> {
    // Check if campaign exists
    const campaign = await this.campaignRepository.findById(input.id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign can be deleted
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      throw new Error('Cannot delete a campaign that is being sent or has been sent');
    }

    // Delete campaign
    await this.campaignRepository.delete(input.id);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'whatsapp_campaign.deleted',
      {
        campaignId: campaign.id,
        name: campaign.name,
        workspaceId: campaign.workspaceId,
        deletedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
    };
  }
}
