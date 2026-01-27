/**
 * PostgreSQL Tag Repository Implementation
 */

import { eq, and, sql, desc } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { tags as tagsTable } from '../../db/schema.js';
import { Tag, CreateTagInput, UpdateTagInput, TagFilters } from '../../domain/tags/index.js';
import type { ITagRepository } from './tag.repository.interface.js';

export class PostgresTagRepository implements ITagRepository {
  constructor(private db: any) { }

  /**
   * Create a new tag
   */
  async create(data: CreateTagInput & { id?: string }): Promise<Tag> {
    const id = data.id || generateId();

    const [tagRow] = await this.db
      .insert(tagsTable)
      .values({
        id,
        workspaceId: data.workspaceId,
        key: data.key,
        value: data.value,
        isPrimary: data.isPrimary ?? false,
        description: data.description ?? null,
        color: data.color ?? null,
      })
      .returning();

    return Tag.fromPersistence({
      id: tagRow.id,
      workspaceId: tagRow.workspaceId,
      key: tagRow.key,
      value: tagRow.value,
      isPrimary: tagRow.isPrimary,
      description: tagRow.description,
      color: tagRow.color,
      createdAt: tagRow.createdAt,
      updatedAt: tagRow.updatedAt,
    });
  }

  /**
   * Find tag by ID
   */
  async findById(id: string): Promise<Tag | null> {
    const [tagRow] = await this.db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.id, id))
      .limit(1);

    if (!tagRow) {
      return null;
    }

    return Tag.fromPersistence({
      id: tagRow.id,
      workspaceId: tagRow.workspaceId,
      key: tagRow.key,
      value: tagRow.value,
      isPrimary: tagRow.isPrimary,
      description: tagRow.description,
      color: tagRow.color,
      createdAt: tagRow.createdAt,
      updatedAt: tagRow.updatedAt,
    });
  }

  /**
   * Find tags by filters
   */
  async find(filters: TagFilters): Promise<Tag[]> {
    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(tagsTable.workspaceId, filters.workspaceId));
    }
    if (filters.key) {
      conditions.push(eq(tagsTable.key, filters.key));
    }
    if (filters.value) {
      conditions.push(eq(tagsTable.value, filters.value));
    }
    if (filters.isPrimary !== undefined) {
      conditions.push(eq(tagsTable.isPrimary, filters.isPrimary));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tagRows = await this.db
      .select()
      .from(tagsTable)
      .where(whereClause)
      .orderBy(tagsTable.key, tagsTable.value);

    return tagRows.map((row: any) =>
      Tag.fromPersistence({
        id: row.id,
        workspaceId: row.workspaceId,
        key: row.key,
        value: row.value,
        isPrimary: row.isPrimary,
        description: row.description,
        color: row.color,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find tags by workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Tag[]> {
    return this.find({ workspaceId });
  }

  /**
   * Find primary tags by workspace
   */
  async findPrimaryByWorkspace(workspaceId: string): Promise<Tag[]> {
    return this.find({ workspaceId, isPrimary: true });
  }

  /**
   * Get unique tag keys by workspace
   */
  async getKeysByWorkspace(workspaceId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ key: tagsTable.key })
      .from(tagsTable)
      .where(eq(tagsTable.workspaceId, workspaceId))
      .orderBy(tagsTable.key);

    return rows.map((row: any) => row.key);
  }

  /**
   * Get unique tag values for a key by workspace
   */
  async getValuesByKey(workspaceId: string, key: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ value: tagsTable.value })
      .from(tagsTable)
      .where(and(eq(tagsTable.workspaceId, workspaceId), eq(tagsTable.key, key)))
      .orderBy(tagsTable.value);

    return rows.map((row: any) => row.value);
  }

  /**
   * Update tag
   */
  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const [tagRow] = await this.db
      .update(tagsTable)
      .set({
        ...(data.key !== undefined && { key: data.key }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        updatedAt: new Date(),
      })
      .where(eq(tagsTable.id, id))
      .returning();

    return Tag.fromPersistence({
      id: tagRow.id,
      workspaceId: tagRow.workspaceId,
      key: tagRow.key,
      value: tagRow.value,
      isPrimary: tagRow.isPrimary,
      description: tagRow.description,
      color: tagRow.color,
      createdAt: tagRow.createdAt,
      updatedAt: tagRow.updatedAt,
    });
  }

  /**
   * Delete tag
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(tagsTable).where(eq(tagsTable.id, id));
  }

  /**
   * Check if tag exists
   */
  async exists(id: string): Promise<boolean> {
    const [tag] = await this.db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(eq(tagsTable.id, id))
      .limit(1);

    return !!tag;
  }

  /**
   * Find tag by workspace, key, and value
   */
  async findByWorkspaceKeyAndValue(workspaceId: string, key: string, value: string): Promise<Tag | null> {
    const [tagRow] = await this.db
      .select()
      .from(tagsTable)
      .where(and(
        eq(tagsTable.workspaceId, workspaceId),
        eq(tagsTable.key, key),
        eq(tagsTable.value, value)
      ))
      .limit(1);

    if (!tagRow) {
      return null;
    }

    return Tag.fromPersistence({
      id: tagRow.id,
      workspaceId: tagRow.workspaceId,
      key: tagRow.key,
      value: tagRow.value,
      isPrimary: tagRow.isPrimary,
      description: tagRow.description,
      color: tagRow.color,
      createdAt: tagRow.createdAt,
      updatedAt: tagRow.updatedAt,
    });
  }
}

// Export the class as default for dynamic import
export default PostgresTagRepository;
