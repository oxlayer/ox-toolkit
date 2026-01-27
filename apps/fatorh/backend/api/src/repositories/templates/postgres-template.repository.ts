/**
 * PostgreSQL Template Repository Implementation
 */

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { templates as templatesTable } from '../../db/schema.js';
import { Template, CreateTemplateInput, UpdateTemplateInput, TemplateFilters } from '../../domain/templates/index.js';
import type { ITemplateRepository } from './template.repository.interface.js';

export class PostgresTemplateRepository implements ITemplateRepository {
  constructor(private db: any) { }

  /**
   * Create a new template
   */
  async create(data: CreateTemplateInput & { id?: string }): Promise<Template> {
    const id = data.id || generateId();

    const [templateRow] = await this.db
      .insert(templatesTable)
      .values({
        id,
        workspaceId: data.workspaceId,
        name: data.name,
        type: data.type,
        subject: data.subject ?? null,
        body: data.body,
        variables: data.variables ?? null,
        category: data.category ?? null,
        language: data.language ?? 'pt_BR',
        isActive: data.isActive ?? true,
        externalId: data.externalId ?? null,
        status: data.status ?? 'draft',
      })
      .returning();

    return Template.fromPersistence({
      id: templateRow.id,
      workspaceId: templateRow.workspaceId,
      name: templateRow.name,
      type: templateRow.type,
      subject: templateRow.subject,
      body: templateRow.body,
      variables: templateRow.variables,
      category: templateRow.category,
      language: templateRow.language,
      isActive: templateRow.isActive,
      externalId: templateRow.externalId,
      status: templateRow.status,
      createdAt: templateRow.createdAt,
      updatedAt: templateRow.updatedAt,
    });
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<Template | null> {
    const [templateRow] = await this.db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.id, id))
      .limit(1);

    if (!templateRow) {
      return null;
    }

    return Template.fromPersistence({
      id: templateRow.id,
      workspaceId: templateRow.workspaceId,
      name: templateRow.name,
      type: templateRow.type,
      subject: templateRow.subject,
      body: templateRow.body,
      variables: templateRow.variables,
      category: templateRow.category,
      language: templateRow.language,
      isActive: templateRow.isActive,
      externalId: templateRow.externalId,
      status: templateRow.status,
      createdAt: templateRow.createdAt,
      updatedAt: templateRow.updatedAt,
    });
  }

  /**
   * Find templates by filters
   */
  async find(filters: TemplateFilters): Promise<Template[]> {
    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(templatesTable.workspaceId, filters.workspaceId));
    }
    if (filters.type) {
      conditions.push(eq(templatesTable.type, filters.type));
    }
    if (filters.category) {
      conditions.push(eq(templatesTable.category, filters.category));
    }
    if (filters.status) {
      conditions.push(eq(templatesTable.status, filters.status));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(templatesTable.isActive, filters.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const templateRows = await this.db
      .select()
      .from(templatesTable)
      .where(whereClause)
      .orderBy(desc(templatesTable.createdAt));

    return templateRows.map((row: any) =>
      Template.fromPersistence({
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        type: row.type,
        subject: row.subject,
        body: row.body,
        variables: row.variables,
        category: row.category,
        language: row.language,
        isActive: row.isActive,
        externalId: row.externalId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find templates by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Template[]> {
    return this.find({ workspaceId });
  }

  /**
   * Find templates by type
   */
  async findByType(type: string): Promise<Template[]> {
    return this.find({ type: type as any });
  }

  /**
   * Find active templates by workspace
   */
  async findActiveByWorkspace(workspaceId: string): Promise<Template[]> {
    return this.find({ workspaceId, isActive: true });
  }

  /**
   * Update template
   */
  async update(id: string, data: UpdateTemplateInput): Promise<Template> {
    const [templateRow] = await this.db
      .update(templatesTable)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.body !== undefined && { body: data.body }),
        ...(data.variables !== undefined && { variables: data.variables }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.externalId !== undefined && { externalId: data.externalId }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(templatesTable.id, id))
      .returning();

    return Template.fromPersistence({
      id: templateRow.id,
      workspaceId: templateRow.workspaceId,
      name: templateRow.name,
      type: templateRow.type,
      subject: templateRow.subject,
      body: templateRow.body,
      variables: templateRow.variables,
      category: templateRow.category,
      language: templateRow.language,
      isActive: templateRow.isActive,
      externalId: templateRow.externalId,
      status: templateRow.status,
      createdAt: templateRow.createdAt,
      updatedAt: templateRow.updatedAt,
    });
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(templatesTable).where(eq(templatesTable.id, id));
  }

  /**
   * Check if template exists
   */
  async exists(id: string): Promise<boolean> {
    const [template] = await this.db
      .select({ id: templatesTable.id })
      .from(templatesTable)
      .where(eq(templatesTable.id, id))
      .limit(1);

    return !!template;
  }

  /**
   * Find template by external ID
   */
  async findByExternalId(externalId: string): Promise<Template | null> {
    const [templateRow] = await this.db
      .select()
      .from(templatesTable)
      .where(eq(templatesTable.externalId, externalId))
      .limit(1);

    if (!templateRow) {
      return null;
    }

    return Template.fromPersistence({
      id: templateRow.id,
      workspaceId: templateRow.workspaceId,
      name: templateRow.name,
      type: templateRow.type,
      subject: templateRow.subject,
      body: templateRow.body,
      variables: templateRow.variables,
      category: templateRow.category,
      language: templateRow.language,
      isActive: templateRow.isActive,
      externalId: templateRow.externalId,
      status: templateRow.status,
      createdAt: templateRow.createdAt,
      updatedAt: templateRow.updatedAt,
    });
  }
}

// Export the class as default for dynamic import
export default PostgresTemplateRepository;
