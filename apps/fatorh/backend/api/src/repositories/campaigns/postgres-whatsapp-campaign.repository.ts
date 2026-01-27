/**
 * PostgreSQL WhatsApp Campaign Repository Implementation
 */

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { whatsappCampaigns as campaignsTable } from '../../db/schema.js';
import { WhatsAppCampaign, CreateWhatsAppCampaignInput, UpdateWhatsAppCampaignInput, WhatsAppCampaignFilters } from '../../domain/campaigns/index.js';
import type { IWhatsAppCampaignRepository } from './whatsapp-campaign.repository.interface.js';

export class PostgresWhatsAppCampaignRepository implements IWhatsAppCampaignRepository {
  constructor(private db: any) { }

  /**
   * Create a new campaign
   */
  async create(data: CreateWhatsAppCampaignInput & { id?: string }): Promise<WhatsAppCampaign> {
    const id = data.id || generateId();
    const status = data.scheduledAt ? 'scheduled' : 'draft';

    const [campaignRow] = await this.db
      .insert(campaignsTable)
      .values({
        id,
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
      })
      .returning();

    return WhatsAppCampaign.fromPersistence({
      id: campaignRow.id,
      workspaceId: campaignRow.workspaceId,
      examId: campaignRow.examId,
      templateId: campaignRow.templateId,
      name: campaignRow.name,
      description: campaignRow.description,
      status: campaignRow.status,
      scheduledAt: campaignRow.scheduledAt,
      startedAt: campaignRow.startedAt,
      completedAt: campaignRow.completedAt,
      totalRecipients: campaignRow.totalRecipients,
      sentCount: campaignRow.sentCount,
      deliveredCount: campaignRow.deliveredCount,
      failedCount: campaignRow.failedCount,
      tags: campaignRow.tags,
      createdAt: campaignRow.createdAt,
      updatedAt: campaignRow.updatedAt,
    });
  }

  /**
   * Find campaign by ID
   */
  async findById(id: string): Promise<WhatsAppCampaign | null> {
    const [campaignRow] = await this.db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .limit(1);

    if (!campaignRow) {
      return null;
    }

    return WhatsAppCampaign.fromPersistence({
      id: campaignRow.id,
      workspaceId: campaignRow.workspaceId,
      examId: campaignRow.examId,
      templateId: campaignRow.templateId,
      name: campaignRow.name,
      description: campaignRow.description,
      status: campaignRow.status,
      scheduledAt: campaignRow.scheduledAt,
      startedAt: campaignRow.startedAt,
      completedAt: campaignRow.completedAt,
      totalRecipients: campaignRow.totalRecipients,
      sentCount: campaignRow.sentCount,
      deliveredCount: campaignRow.deliveredCount,
      failedCount: campaignRow.failedCount,
      tags: campaignRow.tags,
      createdAt: campaignRow.createdAt,
      updatedAt: campaignRow.updatedAt,
    });
  }

  /**
   * Find campaigns by filters
   */
  async find(filters: WhatsAppCampaignFilters): Promise<WhatsAppCampaign[]> {
    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(campaignsTable.workspaceId, filters.workspaceId));
    }
    if (filters.examId) {
      conditions.push(eq(campaignsTable.examId, filters.examId));
    }
    if (filters.templateId) {
      conditions.push(eq(campaignsTable.templateId, filters.templateId));
    }
    if (filters.status) {
      conditions.push(eq(campaignsTable.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const campaignRows = await this.db
      .select()
      .from(campaignsTable)
      .where(whereClause)
      .orderBy(desc(campaignsTable.createdAt));

    return campaignRows.map((row: any) =>
      WhatsAppCampaign.fromPersistence({
        id: row.id,
        workspaceId: row.workspaceId,
        examId: row.examId,
        templateId: row.templateId,
        name: row.name,
        description: row.description,
        status: row.status,
        scheduledAt: row.scheduledAt,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        totalRecipients: row.totalRecipients,
        sentCount: row.sentCount,
        deliveredCount: row.deliveredCount,
        failedCount: row.failedCount,
        tags: row.tags,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find campaigns by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<WhatsAppCampaign[]> {
    return this.find({ workspaceId });
  }

  /**
   * Find campaigns by exam
   */
  async findByExam(examId: string): Promise<WhatsAppCampaign[]> {
    return this.find({ examId });
  }

  /**
   * Find campaigns by status
   */
  async findByStatus(status: string): Promise<WhatsAppCampaign[]> {
    return this.find({ status: status as any });
  }

  /**
   * Update campaign
   */
  async update(id: string, data: UpdateWhatsAppCampaignInput): Promise<WhatsAppCampaign> {
    const [campaignRow] = await this.db
      .update(campaignsTable)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.templateId !== undefined && { templateId: data.templateId }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt,
          status: data.scheduledAt ? 'scheduled' : 'draft',
        }),
        ...(data.tags !== undefined && { tags: data.tags }),
        updatedAt: new Date(),
      })
      .where(eq(campaignsTable.id, id))
      .returning();

    return WhatsAppCampaign.fromPersistence({
      id: campaignRow.id,
      workspaceId: campaignRow.workspaceId,
      examId: campaignRow.examId,
      templateId: campaignRow.templateId,
      name: campaignRow.name,
      description: campaignRow.description,
      status: campaignRow.status,
      scheduledAt: campaignRow.scheduledAt,
      startedAt: campaignRow.startedAt,
      completedAt: campaignRow.completedAt,
      totalRecipients: campaignRow.totalRecipients,
      sentCount: campaignRow.sentCount,
      deliveredCount: campaignRow.deliveredCount,
      failedCount: campaignRow.failedCount,
      tags: campaignRow.tags,
      createdAt: campaignRow.createdAt,
      updatedAt: campaignRow.updatedAt,
    });
  }

  /**
   * Update campaign counts
   */
  async updateCounts(id: string, data: { sent?: number; delivered?: number; failed?: number }): Promise<WhatsAppCampaign> {
    const [campaignRow] = await this.db
      .update(campaignsTable)
      .set({
        ...(data.sent !== undefined && { sentCount: data.sent }),
        ...(data.delivered !== undefined && { deliveredCount: data.delivered }),
        ...(data.failed !== undefined && { failedCount: data.failed }),
        updatedAt: new Date(),
      })
      .where(eq(campaignsTable.id, id))
      .returning();

    return WhatsAppCampaign.fromPersistence({
      id: campaignRow.id,
      workspaceId: campaignRow.workspaceId,
      examId: campaignRow.examId,
      templateId: campaignRow.templateId,
      name: campaignRow.name,
      description: campaignRow.description,
      status: campaignRow.status,
      scheduledAt: campaignRow.scheduledAt,
      startedAt: campaignRow.startedAt,
      completedAt: campaignRow.completedAt,
      totalRecipients: campaignRow.totalRecipients,
      sentCount: campaignRow.sentCount,
      deliveredCount: campaignRow.deliveredCount,
      failedCount: campaignRow.failedCount,
      tags: campaignRow.tags,
      createdAt: campaignRow.createdAt,
      updatedAt: campaignRow.updatedAt,
    });
  }

  /**
   * Update campaign status
   */
  async updateStatus(id: string, status: string): Promise<WhatsAppCampaign> {
    const updates: any = { status, updatedAt: new Date() };

    if (status === 'sending') {
      updates.startedAt = new Date();
    } else if (status === 'sent' || status === 'failed' || status === 'cancelled') {
      updates.completedAt = new Date();
    }

    const [campaignRow] = await this.db
      .update(campaignsTable)
      .set(updates)
      .where(eq(campaignsTable.id, id))
      .returning();

    return WhatsAppCampaign.fromPersistence({
      id: campaignRow.id,
      workspaceId: campaignRow.workspaceId,
      examId: campaignRow.examId,
      templateId: campaignRow.templateId,
      name: campaignRow.name,
      description: campaignRow.description,
      status: campaignRow.status,
      scheduledAt: campaignRow.scheduledAt,
      startedAt: campaignRow.startedAt,
      completedAt: campaignRow.completedAt,
      totalRecipients: campaignRow.totalRecipients,
      sentCount: campaignRow.sentCount,
      deliveredCount: campaignRow.deliveredCount,
      failedCount: campaignRow.failedCount,
      tags: campaignRow.tags,
      createdAt: campaignRow.createdAt,
      updatedAt: campaignRow.updatedAt,
    });
  }

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(campaignsTable).where(eq(campaignsTable.id, id));
  }

  /**
   * Check if campaign exists
   */
  async exists(id: string): Promise<boolean> {
    const [campaign] = await this.db
      .select({ id: campaignsTable.id })
      .from(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .limit(1);

    return !!campaign;
  }
}

// Export the class as default for dynamic import
export default PostgresWhatsAppCampaignRepository;
