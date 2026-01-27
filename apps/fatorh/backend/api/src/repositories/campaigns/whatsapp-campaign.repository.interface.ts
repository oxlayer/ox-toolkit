/**
 * WhatsApp Campaign Repository Interface
 */

import { WhatsAppCampaign, CreateWhatsAppCampaignInput, UpdateWhatsAppCampaignInput, WhatsAppCampaignFilters } from '../../domain/campaigns/index.js';

export interface IWhatsAppCampaignRepository {
  /**
   * Create a new campaign
   */
  create(data: CreateWhatsAppCampaignInput & { id?: string }): Promise<WhatsAppCampaign>;

  /**
   * Find campaign by ID
   */
  findById(id: string): Promise<WhatsAppCampaign | null>;

  /**
   * Find campaigns by filters
   */
  find(filters: WhatsAppCampaignFilters): Promise<WhatsAppCampaign[]>;

  /**
   * Find campaigns by workspace
   */
  findByWorkspace(workspaceId: string): Promise<WhatsAppCampaign[]>;

  /**
   * Find campaigns by exam
   */
  findByExam(examId: string): Promise<WhatsAppCampaign[]>;

  /**
   * Find campaigns by status
   */
  findByStatus(status: string): Promise<WhatsAppCampaign[]>;

  /**
   * Update campaign
   */
  update(id: string, data: UpdateWhatsAppCampaignInput): Promise<WhatsAppCampaign>;

  /**
   * Update campaign counts
   */
  updateCounts(id: string, data: { sent?: number; delivered?: number; failed?: number }): Promise<WhatsAppCampaign>;

  /**
   * Update campaign status
   */
  updateStatus(id: string, status: string): Promise<WhatsAppCampaign>;

  /**
   * Delete campaign
   */
  delete(id: string): Promise<void>;

  /**
   * Check if campaign exists
   */
  exists(id: string): Promise<boolean>;
}
