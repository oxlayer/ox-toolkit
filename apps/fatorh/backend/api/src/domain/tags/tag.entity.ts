/**
 * Tag Domain Entity
 *
 * A Tag represents a key-value pair used for categorizing resources
 * within a workspace. Tags can be used to filter and organize candidates,
 * exams, and other entities.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

export interface TagProps {
  id: string;
  workspaceId: string;
  key: string;
  value: string;
  isPrimary: boolean;
  description: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagInput {
  workspaceId: string;
  key: string;
  value: string;
  isPrimary?: boolean;
  description?: string;
  color?: string;
}

export interface UpdateTagInput {
  key?: string;
  value?: string;
  isPrimary?: boolean;
  description?: string;
  color?: string;
}

export interface TagFilters {
  workspaceId?: string;
  key?: string;
  value?: string;
  isPrimary?: boolean;
}

/**
 * Tag Domain Entity
 *
 * Represents a key-value tag for categorizing resources.
 */
export class Tag extends Entity<TagProps> {
  protected props: TagProps;

  constructor(props: TagProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get key(): string {
    return this.props.key;
  }

  get value(): string {
    return this.props.value;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get description(): string | null {
    return this.props.description;
  }

  get color(): string | null {
    return this.props.color;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update tag details
   */
  updateDetails(data: UpdateTagInput): void {
    if (data.key !== undefined) {
      this.props.key = data.key;
    }
    if (data.value !== undefined) {
      this.props.value = data.value;
    }
    if (data.isPrimary !== undefined) {
      this.props.isPrimary = data.isPrimary;
    }
    if (data.description !== undefined) {
      this.props.description = data.description;
    }
    if (data.color !== undefined) {
      this.props.color = data.color;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Tag
   */
  static create(data: CreateTagInput & { id: string }): Tag {
    return new Tag({
      id: data.id,
      workspaceId: data.workspaceId,
      key: data.key,
      value: data.value,
      isPrimary: data.isPrimary ?? false,
      description: data.description ?? null,
      color: data.color ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: TagProps): Tag {
    return new Tag(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): TagProps {
    return { ...this.props };
  }
}
