/**
 * WhatsApp Campaign Domain Entity
 *
 * A WhatsAppCampaign represents a messaging campaign using WhatsApp templates.
 * Campaigns can be scheduled and sent to multiple candidates.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface WhatsAppCampaignProps {
  id: string;
  workspaceId: string;
  examId: string | null;
  templateId: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
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
}

export interface CreateWhatsAppCampaignInput {
  workspaceId: string;
  examId?: string;
  templateId: string;
  name: string;
  description?: string;
  scheduledAt?: Date;
  tags?: string[];
}

export interface UpdateWhatsAppCampaignInput {
  name?: string;
  description?: string;
  templateId?: string;
  scheduledAt?: Date;
  tags?: string[];
}

export interface WhatsAppCampaignFilters {
  workspaceId?: string;
  examId?: string;
  templateId?: string;
  status?: CampaignStatus;
}

/**
 * WhatsApp Campaign Domain Entity
 *
 * Represents a WhatsApp messaging campaign.
 */
export class WhatsAppCampaign extends Entity<WhatsAppCampaignProps> {
  declare props: WhatsAppCampaignProps;

  constructor(props: WhatsAppCampaignProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get examId(): string | null {
    return this.props.examId;
  }

  get templateId(): string {
    return this.props.templateId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): CampaignStatus {
    return this.props.status;
  }

  get scheduledAt(): Date | null {
    return this.props.scheduledAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get totalRecipients(): number {
    return this.props.totalRecipients;
  }

  get sentCount(): number {
    return this.props.sentCount;
  }

  get deliveredCount(): number {
    return this.props.deliveredCount;
  }

  get failedCount(): number {
    return this.props.failedCount;
  }

  get tags(): string[] | null {
    return this.props.tags;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if campaign can be started
   */
  canStart(): boolean {
    return this.props.status === 'draft' || this.props.status === 'scheduled';
  }

  /**
   * Check if campaign is finished
   */
  isFinished(): boolean {
    return this.props.status === 'sent' || this.props.status === 'failed' || this.props.status === 'cancelled';
  }

  /**
   * Start the campaign
   */
  start(): void {
    if (!this.canStart()) {
      throw new Error('Campaign cannot be started');
    }
    this.props.status = 'sending';
    this.props.startedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Complete the campaign
   */
  complete(): void {
    if (this.props.status !== 'sending') {
      throw new Error('Campaign is not in sending state');
    }
    this.props.status = 'sent';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark campaign as failed
   */
  fail(): void {
    this.props.status = 'failed';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Cancel the campaign
   */
  cancel(): void {
    if (this.isFinished()) {
      throw new Error('Cannot cancel a finished campaign');
    }
    this.props.status = 'cancelled';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Update recipient counts
   */
  updateCounts(data: { sent?: number; delivered?: number; failed?: number }): void {
    if (data.sent !== undefined) {
      this.props.sentCount = data.sent;
    }
    if (data.delivered !== undefined) {
      this.props.deliveredCount = data.delivered;
    }
    if (data.failed !== undefined) {
      this.props.failedCount = data.failed;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Update campaign details
   */
  updateDetails(data: UpdateWhatsAppCampaignInput): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.templateId !== undefined) {
      this.props.templateId = data.templateId;
    }
    if (data.scheduledAt !== undefined) {
      this.props.scheduledAt = data.scheduledAt;
      this.props.status = 'scheduled';
    }
    if (data.tags !== undefined) {
      this.props.tags = data.tags;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new WhatsApp Campaign
   */
  static create(data: CreateWhatsAppCampaignInput & { id: string }): WhatsAppCampaign {
    const status = data.scheduledAt ? 'scheduled' : 'draft';
    return new WhatsAppCampaign({
      id: data.id,
      workspaceId: data.workspaceId,
      examId: data.examId ?? null,
      templateId: data.templateId,
      name: data.name,
      description: data.description ?? null,
      status,
      scheduledAt: data.scheduledAt ?? null,
      startedAt: null,
      completedAt: null,
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      tags: data.tags ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: WhatsAppCampaignProps): WhatsAppCampaign {
    return new WhatsAppCampaign(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): WhatsAppCampaignProps {
    return { ...this.props };
  }
}
