/**
 * Workspace Builder
 *
 * Test data builder for Workspace entities using the Builder pattern.
 * Provides fluent API for creating test workspaces with sensible defaults.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import type { Workspace, CreateWorkspaceInput } from '../../repositories/workspaces/workspace.repository.interface.js';
import type { Builder } from './builder.js';

/**
 * Workspace data builder
 */
export class WorkspaceBuilder implements Builder<Workspace> {
  private _id: string = generateTestId('workspace');
  private _name: string = 'Test Workspace';
  private _description: string | null = 'Test workspace description';
  private _organizationId: string = generateTestId('organization');
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();
  private _deletedAt: Date | null = null;

  /**
   * Set workspace ID
   */
  withId(id: string): this {
    this._id = id;
    return this;
  }

  /**
   * Set workspace name
   */
  withName(name: string): this {
    this._name = name;
    return this;
  }

  /**
   * Set workspace description
   */
  withDescription(description: string): this {
    this._description = description;
    return this;
  }

  /**
   * Set workspace description to null
   */
  withNoDescription(): this {
    this._description = null;
    return this;
  }

  /**
   * Set organization ID
   */
  withOrganizationId(organizationId: string): this {
    this._organizationId = organizationId;
    return this;
  }

  /**
   * Set deleted at timestamp (soft delete)
   */
  withDeletedAt(deletedAt: Date): this {
    this._deletedAt = deletedAt;
    return this;
  }

  /**
   * Mark as deleted
   */
  withDeleted(): this {
    this._deletedAt = new Date();
    return this;
  }

  /**
   * Build the workspace
   */
  build(): Workspace {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      organizationId: this._organizationId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}

/**
 * Create a workspace builder with defaults
 */
export function createWorkspaceBuilder(defaults?: Partial<Workspace>): WorkspaceBuilder {
  const builder = new WorkspaceBuilder();
  if (defaults) {
    if (defaults.id) builder.withId(defaults.id);
    if (defaults.name) builder.withName(defaults.name);
    if (defaults.description !== undefined) {
      if (defaults.description === null) {
        builder.withNoDescription();
      } else {
        builder.withDescription(defaults.description);
      }
    }
    if (defaults.organizationId) builder.withOrganizationId(defaults.organizationId);
    if (defaults.deletedAt) builder.withDeletedAt(defaults.deletedAt);
  }
  return builder;
}
