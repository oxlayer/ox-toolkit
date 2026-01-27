/**
 * Todo Domain Entity
 *
 * This entity uses the CrudEntityTemplate from @oxlayer/snippets
 * which provides common patterns for entities with status, timestamps, and ownership.
 *
 * @see @oxlayer/snippets/domain
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';

// Validation constants
const MAX_TITLE_LENGTH = 200;
const MIN_TITLE_LENGTH = 1;

/**
 * Validation error class
 */
export class TodoValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'TodoValidationError';
  }
}

/**
 * Decode HTML entities in text
 * Reverses the HTML escaping done by sanitizeString for API responses
 */
function decodeHtmlEntities(text: string): string {
  const htmlDecodeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
    '&apos;': "'",
  };

  return text.replace(/&(amp|lt|gt|quot|#x27|#39|apos);/g, (match) => {
    return htmlDecodeMap[match] || match;
  });
}

/**
 * Sanitize input to prevent XSS attacks
 *
 * This function performs aggressive sanitization to remove dangerous patterns:
 * 1. Removes dangerous JavaScript protocols (javascript:, data:, vbscript:)
 * 2. Removes dangerous event handlers (onerror, onload, onclick, etc.)
 * 3. Escapes HTML special characters
 */
function sanitizeString(input: string): string {
  // Trim whitespace
  let sanitized = input.trim();

  // Remove dangerous JavaScript protocols (case-insensitive)
  sanitized = sanitized.replace(/\b(javascript|data|vbscript):/gi, '');

  // Remove dangerous event handler patterns (case-insensitive)
  // This catches onerror, onload, onclick, onmouseover, etc.
  sanitized = sanitized.replace(/\bon[a-z]+/gi, '');

  // Escape HTML special characters to prevent XSS
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  sanitized = sanitized.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);

  return sanitized;
}

/**
 * Validate and sanitize title
 */
function validateAndSanitizeTitle(title: string): string {
  // Check if title is provided
  if (!title || typeof title !== 'string') {
    throw new TodoValidationError('title', 'Title is required');
  }

  // Trim and check if empty after trim
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new TodoValidationError('title', 'Title cannot be empty or whitespace only');
  }

  // Check minimum length
  if (trimmed.length < MIN_TITLE_LENGTH) {
    throw new TodoValidationError('title', `Title must be at least ${MIN_TITLE_LENGTH} character`);
  }

  // Check maximum length (before sanitization to prevent DoS)
  if (title.length > 10000) {
    throw new TodoValidationError('title', 'Title is too long');
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new TodoValidationError('title', `Title cannot exceed ${MAX_TITLE_LENGTH} characters`);
  }

  // Sanitize to prevent XSS
  return sanitizeString(trimmed);
}

/**
 * Validate userId
 */
function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new TodoValidationError('userId', 'User ID is required');
  }

  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    throw new TodoValidationError('userId', 'User ID cannot be empty');
  }
}

/**
 * Validate status
 */
function validateStatus(status: string): asserts status is TodoStatus {
  const validStatuses: TodoStatus[] = ['pending', 'in_progress', 'completed'];
  if (!validStatuses.includes(status as TodoStatus)) {
    throw new TodoValidationError('status', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

/**
 * CRM context types for optional task linking
 */
export type ContextType = 'contact' | 'company' | 'deal' | 'candidate' | 'position';

/**
 * Recurrence rule for recurring tasks
 */
export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO date string
  count?: number;
}

export interface TodoProps extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  userId: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId?: string;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
  // NEW: Workspace and CRM context fields
  workspaceId: string;
  contextType?: ContextType;
  contextId?: string;
  recurrence?: RecurrenceRule;
}

/**
 * Todo Entity
 *
 * Extends CrudEntityTemplate which provides:
 * - Status management (isStatus, updateStatus)
 * - Timestamp helpers (touch, createdAfter, updatedAfter)
 * - Ownership helpers (ownerId, isOwnedBy, transferOwnership)
 */
export class Todo extends CrudEntityTemplate<string> {
  private props: TodoProps;

  private constructor(props: TodoProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): TodoStatus {
    return this.props.status;
  }

  get userId(): string {
    return this.props.userId;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get projectId(): string | undefined {
    return this.props.projectId;
  }

  get sectionId(): string | undefined {
    return this.props.sectionId;
  }

  get priority(): number | undefined {
    return this.props.priority;
  }

  get order(): number | undefined {
    return this.props.order;
  }

  // NEW: Workspace and CRM context getters
  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get contextType(): ContextType | undefined {
    return this.props.contextType;
  }

  get contextId(): string | undefined {
    return this.props.contextId;
  }

  get recurrence(): RecurrenceRule | undefined {
    return this.props.recurrence;
  }

  /**
   * Mark todo as completed
   *
   * Business rule: Can only complete if not already completed
   */
  markAsCompleted(): void {
    if (this.isStatus('completed')) return;

    this.updateStatus('completed');
    this.props.completedAt = new Date();
    this.touch();
  }

  /**
   * Mark todo as in progress
   *
   * Business rule: Can only mark as in progress if not already in progress
   */
  markAsInProgress(): void {
    if (this.isStatus('in_progress')) return;

    this.updateStatus('in_progress');
    this.touch();
  }

  /**
   * Reset todo to pending
   *
   * Business rule: Can only reset to pending if not already pending
   */
  resetToPending(): void {
    if (this.isStatus('pending')) return;

    this.updateStatus('pending');
    this.props.completedAt = undefined;
    this.touch();
  }

  /**
   * Update todo details
   *
   * Business rule: Updates title, description, or due date
   */
  updateDetails(data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    projectId?: string;
    sectionId?: string;
    priority?: number;
    order?: number;
    // NEW: CRM context updates
    contextType?: ContextType;
    contextId?: string;
    recurrence?: RecurrenceRule;
  }): void {
    if (data.title !== undefined) {
      if (data.title === '') {
        throw new TodoValidationError('title', 'Title cannot be empty');
      }
      this.props.title = validateAndSanitizeTitle(data.title);
    }
    if (data.description !== undefined) {
      // Sanitize description as well to prevent XSS
      this.props.description = data.description ? sanitizeString(data.description) : undefined;
    }
    if (data.dueDate !== undefined) {
      this.props.dueDate = data.dueDate;
    }
    if (data.projectId !== undefined) {
      this.props.projectId = data.projectId;
    }
    if (data.sectionId !== undefined) {
      this.props.sectionId = data.sectionId;
    }
    if (data.priority !== undefined) {
      this.props.priority = data.priority;
    }
    if (data.order !== undefined) {
      this.props.order = data.order;
    }
    // NEW: Handle CRM context updates
    if (data.contextType !== undefined || data.contextId !== undefined) {
      this.updateContext(data);
    }
    if (data.recurrence !== undefined) {
      this.props.recurrence = data.recurrence;
    }
    this.touch();
  }

  /**
   * Update status with validation
   */
  updateStatus(status: TodoStatus): void {
    validateStatus(status);
    this.props.status = status;
    this.touch();
  }

  /**
   * Check if todo has CRM context
   */
  hasContext(): boolean {
    return this.props.contextType !== undefined && this.props.contextId !== undefined;
  }

  /**
   * Get full context reference
   */
  getContext(): { type: ContextType; id: string } | null {
    if (!this.hasContext()) {
      return null;
    }
    return { type: this.props.contextType!, id: this.props.contextId! };
  }

  /**
   * Attach CRM context to todo
   */
  attachContext(contextType: ContextType, contextId: string): void {
    this.props.contextType = contextType;
    this.props.contextId = contextId;
    this.touch();
  }

  /**
   * Remove CRM context from todo
   */
  removeContext(): void {
    this.props.contextType = undefined;
    this.props.contextId = undefined;
    this.touch();
  }

  /**
   * Update CRM context
   */
  updateContext(data: { contextType?: ContextType; contextId?: string }): void {
    if (data.contextType !== undefined) {
      this.props.contextType = data.contextType;
    }
    if (data.contextId !== undefined) {
      this.props.contextId = data.contextId;
    }
    // Ensure both are set or both are null
    if (this.props.contextType && !this.props.contextId) {
      this.props.contextId = '';
    }
    if (!this.props.contextType && this.props.contextId) {
      this.props.contextType = undefined;
    }
    this.touch();
  }

  /**
   * Set recurrence rule
   */
  setRecurrence(recurrence: RecurrenceRule): void {
    this.props.recurrence = recurrence;
    this.touch();
  }

  /**
   * Clear recurrence rule
   */
  clearRecurrence(): void {
    this.props.recurrence = undefined;
    this.touch();
  }

  /**
   * Create a new Todo
   *
   * Factory method for creating new todo entities with validation
   */
  static create(data: {
    id?: string;
    title: string;
    description?: string;
    userId: string;
    workspaceId: string;
    dueDate?: Date;
    projectId?: string;
    sectionId?: string;
    priority?: number;
    order?: number;
    contextType?: ContextType;
    contextId?: string;
    recurrence?: RecurrenceRule;
  }): Todo {
    // Validate and sanitize inputs
    const sanitizedTitle = validateAndSanitizeTitle(data.title);
    validateUserId(data.userId);

    // Sanitize description if provided
    const sanitizedDescription = data.description
      ? sanitizeString(data.description)
      : undefined;

    // Generate ID if not provided
    const id = data.id || `todo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    return new Todo({
      id,
      title: sanitizedTitle,
      description: sanitizedDescription,
      status: 'pending',
      userId: data.userId.trim(),
      workspaceId: data.workspaceId,
      dueDate: data.dueDate,
      projectId: data.projectId,
      sectionId: data.sectionId,
      priority: data.priority ?? 4,
      order: data.order,
      contextType: data.contextType,
      contextId: data.contextId,
      recurrence: data.recurrence,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   *
   * Factory method for reconstructing entities from database rows
   */
  static fromPersistence(data: TodoProps): Todo {
    return new Todo(data);
  }

  /**
   * Convert to persistence format
   *
   * Converts entity to plain object for database storage
   */
  toPersistence(): TodoProps {
    return {
      ...this.props,
      title: decodeHtmlEntities(this.props.title),
      description: this.props.description ? decodeHtmlEntities(this.props.description) : undefined,
    };
  }

  /**
   * Convert to response format (for API responses)
   * Decodes HTML entities that were escaped for security
   */
  toResponse(): TodoProps {
    return this.toPersistence();
  }
}

/**
 * Todo Value Objects
 */

export interface CreateTodoInput {
  title: string;
  description?: string;
  dueDate?: Date;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
  // NEW: CRM context fields
  contextType?: ContextType;
  contextId?: string;
  recurrence?: RecurrenceRule;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  status?: TodoStatus;
  dueDate?: Date;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
  // NEW: CRM context fields
  contextType?: ContextType;
  contextId?: string;
  recurrence?: RecurrenceRule;
}

export interface TodoFilters {
  status?: TodoStatus;
  userId?: string;
  search?: string;
  projectId?: string;
  sectionId?: string;
  // NEW: Workspace and CRM context filters
  workspaceId?: string;
  contextType?: ContextType;
  contextId?: string;
}

// Re-export domain events for convenience
export * from './events.js';
