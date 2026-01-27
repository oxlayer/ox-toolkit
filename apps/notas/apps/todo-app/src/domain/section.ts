/**
 * Section Domain Entity
 *
 * Sub-groups within projects for organizing todos.
 * Uses the TimestampedEntityTemplate from @oxlayer/snippets.
 */

import { TimestampedEntityTemplate } from '@oxlayer/snippets/domain';

// Validation constants
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 1;

/**
 * Validation error class
 */
export class SectionValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'SectionValidationError';
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
    throw new SectionValidationError('name', 'Name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new SectionValidationError('name', 'Name cannot be empty or whitespace only');
  }

  if (trimmed.length < MIN_NAME_LENGTH) {
    throw new SectionValidationError('name', `Name must be at least ${MIN_NAME_LENGTH} character`);
  }

  if (name.length > 10000) {
    throw new SectionValidationError('name', 'Name is too long');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new SectionValidationError('name', `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }

  return sanitizeString(trimmed);
}

/**
 * Validate projectId
 */
function validateProjectId(projectId: string): void {
  if (!projectId || typeof projectId !== 'string') {
    throw new SectionValidationError('projectId', 'Project ID is required');
  }

  const trimmed = projectId.trim();
  if (trimmed.length === 0) {
    throw new SectionValidationError('projectId', 'Project ID cannot be empty');
  }
}

/**
 * Validate order
 */
function validateOrder(order: number): void {
  if (!Number.isInteger(order) || order < 0) {
    throw new SectionValidationError('order', 'Order must be a non-negative integer');
  }
}

export interface SectionProps extends Record<string, unknown> {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
}

/**
 * Section Entity
 *
 * Extends TimestampedEntityTemplate which provides:
 * - Timestamp helpers (touch, createdAfter, updatedAfter)
 */
export class Section extends TimestampedEntityTemplate<string> {
  private props: SectionProps;

  private constructor(props: SectionProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get projectId(): string {
    return this.props.projectId;
  }

  get name(): string {
    return this.props.name;
  }

  get order(): number {
    return this.props.order;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update section details
   */
  updateDetails(data: { name?: string; order?: number }): void {
    if (data.name !== undefined) {
      if (data.name === '') {
        throw new SectionValidationError('name', 'Name cannot be empty');
      }
      this.props.name = validateAndSanitizeName(data.name);
    }
    if (data.order !== undefined) {
      validateOrder(data.order);
      this.props.order = data.order;
    }
    this.touch();
  }

  /**
   * Create a new Section
   *
   * Factory method for creating new section entities with validation
   */
  static create(data: {
    id?: string;
    projectId: string;
    name: string;
    order?: number;
  }): Section {
    const sanitizedName = validateAndSanitizeName(data.name);
    validateProjectId(data.projectId);

    const order = data.order ?? 0;
    validateOrder(order);

    const id = data.id || `sect_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    return new Section({
      id,
      projectId: data.projectId.trim(),
      name: sanitizedName,
      order,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   *
   * Factory method for reconstructing entities from database rows
   */
  static fromPersistence(data: SectionProps): Section {
    return new Section(data);
  }

  /**
   * Convert to persistence format
   *
   * Converts entity to plain object for database storage
   */
  toPersistence(): SectionProps {
    return { ...this.props };
  }
}

/**
 * Section Value Objects
 */

export interface CreateSectionInput {
  projectId: string;
  name: string;
}

export interface UpdateSectionInput {
  name?: string;
  order?: number;
}

export interface SectionFilters {
  projectId?: string;
}
