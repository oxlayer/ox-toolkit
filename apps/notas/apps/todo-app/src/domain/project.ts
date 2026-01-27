/**
 * Project Domain Entity
 *
 * Organizational unit for grouping todos.
 * Uses the TimestampedEntityTemplate from @oxlayer/snippets.
 */

import { TimestampedEntityTemplate } from '@oxlayer/snippets/domain';

// Validation constants
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 1;

/**
 * Validation error class
 */
export class ProjectValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'ProjectValidationError';
  }
}

/**
 * Sanitize input to prevent XSS attacks
 */
function sanitizeString(input: string): string {
  let sanitized = input.trim();
  sanitized = sanitized.replace(/\b(javascript|data|vbscript):/gi, '');
  sanitized = sanitized.replace(/\bon[a-z]+/gi, '');

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  return sanitized.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Validate and sanitize name
 */
function validateAndSanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ProjectValidationError('name', 'Name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ProjectValidationError('name', 'Name cannot be empty or whitespace only');
  }

  if (trimmed.length < MIN_NAME_LENGTH) {
    throw new ProjectValidationError('name', `Name must be at least ${MIN_NAME_LENGTH} character`);
  }

  if (name.length > 10000) {
    throw new ProjectValidationError('name', 'Name is too long');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ProjectValidationError('name', `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }

  return sanitizeString(trimmed);
}

/**
 * Validate color (hex format)
 */
function validateColor(color?: string): void {
  if (!color) return;

  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(color)) {
    throw new ProjectValidationError('color', 'Color must be a valid hex color (e.g., #FF0000)');
  }
}

/**
 * Validate userId
 */
function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new ProjectValidationError('userId', 'User ID is required');
  }

  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    throw new ProjectValidationError('userId', 'User ID cannot be empty');
  }
}

/**
 * Validate order
 */
function validateOrder(order: number): void {
  if (!Number.isInteger(order) || order < 0) {
    throw new ProjectValidationError('order', 'Order must be a non-negative integer');
  }
}

export interface ProjectProps extends Record<string, unknown> {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isInbox: boolean;
  order: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

/**
 * Project Entity
 *
 * Extends TimestampedEntityTemplate which provides:
 * - Timestamp helpers (touch, createdAfter, updatedAfter)
 */
export class Project extends TimestampedEntityTemplate<string> {
  private props: ProjectProps;

  private constructor(props: ProjectProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  get isInbox(): boolean {
    return this.props.isInbox;
  }

  get order(): number {
    return this.props.order;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update project details
   */
  updateDetails(data: { name?: string; color?: string; icon?: string; order?: number }): void {
    if (data.name !== undefined) {
      if (data.name === '') {
        throw new ProjectValidationError('name', 'Name cannot be empty');
      }
      this.props.name = validateAndSanitizeName(data.name);
    }
    if (data.color !== undefined) {
      if (data.color === null || data.color === '') {
        this.props.color = undefined;
      } else {
        validateColor(data.color);
        this.props.color = data.color;
      }
    }
    if (data.icon !== undefined) {
      this.props.icon = data.icon || undefined;
    }
    if (data.order !== undefined) {
      validateOrder(data.order);
      this.props.order = data.order;
    }
    this.touch();
  }

  /**
   * Create a new Project
   *
   * Factory method for creating new project entities with validation
   */
  static create(data: {
    id?: string;
    name: string;
    color?: string;
    icon?: string;
    userId: string;
    order?: number;
    isInbox?: boolean;
  }): Project {
    const sanitizedName = validateAndSanitizeName(data.name);
    validateUserId(data.userId);

    if (data.color) {
      validateColor(data.color);
    }

    const order = data.order ?? 0;
    validateOrder(order);

    const id = data.id || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    return new Project({
      id,
      name: sanitizedName,
      color: data.color,
      icon: data.icon,
      isInbox: data.isInbox ?? false,
      order,
      userId: data.userId.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   *
   * Factory method for reconstructing entities from database rows
   */
  static fromPersistence(data: ProjectProps): Project {
    return new Project(data);
  }

  /**
   * Convert to persistence format
   *
   * Converts entity to plain object for database storage
   */
  toPersistence(): ProjectProps {
    return { ...this.props };
  }
}

/**
 * Project Value Objects
 */

export interface CreateProjectInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput {
  name?: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface ProjectFilters {
  userId?: string;
  isInbox?: boolean;
}
