/**
 * Workspace Domain Entity
 *
 * Workspaces are the core organizing unit of Legend.
 * Each workspace has a type (personal, crm, recruiting) which determines
 * which features are available via feature flags.
 *
 * This enables progressive disclosure - personal workspaces are simple,
 * while CRM/recruiting workspaces show additional features.
 */

import { TimestampedEntityTemplate } from '@oxlayer/snippets/domain';

/**
 * Workspace types determine the feature set available
 */
export type WorkspaceType = 'personal' | 'crm' | 'recruiting';

/**
 * Workspace feature flags control UI visibility
 * These are set based on workspace type but can be customized
 */
export interface WorkspaceFlags {
  features: {
    contacts: boolean;      // Show contacts feature
    companies: boolean;     // Show companies feature
    deals: boolean;         // Show deals/opportunities
    candidates: boolean;    // Show recruiting candidates
    positions: boolean;     // Show job positions
    pipeline: boolean;      // Show kanban pipeline view
  };
}

/**
 * Workspace validation error
 */
export class WorkspaceValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'WorkspaceValidationError';
  }
}

/**
 * Workspace properties interface
 */
export interface WorkspaceProps {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  flags: WorkspaceFlags;
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default feature flags for each workspace type
 */
const DEFAULT_FLAGS: Record<WorkspaceType, WorkspaceFlags> = {
  personal: {
    features: {
      contacts: false,
      companies: false,
      deals: false,
      candidates: false,
      positions: false,
      pipeline: false,
    },
  },
  crm: {
    features: {
      contacts: true,
      companies: true,
      deals: true,
      candidates: false,
      positions: false,
      pipeline: true,
    },
  },
  recruiting: {
    features: {
      contacts: false,
      companies: false,
      deals: false,
      candidates: true,
      positions: true,
      pipeline: true,
    },
  },
};

/**
 * Validate workspace name
 */
function validateName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new WorkspaceValidationError('name', 'Workspace name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new WorkspaceValidationError('name', 'Workspace name cannot be empty');
  }

  if (trimmed.length > 100) {
    throw new WorkspaceValidationError('name', 'Workspace name must be 100 characters or less');
  }

  return trimmed;
}

/**
 * Validate workspace type
 */
function validateType(type: string): asserts type is WorkspaceType {
  const validTypes: WorkspaceType[] = ['personal', 'crm', 'recruiting'];
  if (!validTypes.includes(type as WorkspaceType)) {
    throw new WorkspaceValidationError('type', `Invalid workspace type. Must be one of: ${validTypes.join(', ')}`);
  }
}

/**
 * Validate owner ID
 */
function validateOwnerId(ownerId: string): void {
  if (!ownerId || typeof ownerId !== 'string') {
    throw new WorkspaceValidationError('ownerId', 'Owner ID is required');
  }

  const trimmed = ownerId.trim();
  if (trimmed.length === 0) {
    throw new WorkspaceValidationError('ownerId', 'Owner ID cannot be empty');
  }
}

/**
 * Workspace Entity
 *
 * Represents a workspace - a container for tasks with specific
 * features enabled based on the workspace type.
 */
export class Workspace extends TimestampedEntityTemplate<string> {
  private props: WorkspaceProps;

  private constructor(props: WorkspaceProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get type(): WorkspaceType {
    return this.props.type;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get flags(): WorkspaceFlags {
    return this.props.flags;
  }

  get settings(): Record<string, unknown> {
    return this.props.settings;
  }

  get icon(): string | undefined {
    return this.props.icon;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  /**
   * Check if a specific feature is enabled
   */
  hasFeature(feature: keyof WorkspaceFlags['features']): boolean {
    return this.props.flags.features[feature] ?? false;
  }

  /**
   * Type guards for workspace type
   */
  isPersonal(): boolean {
    return this.props.type === 'personal';
  }

  isCrm(): boolean {
    return this.props.type === 'crm';
  }

  isRecruiting(): boolean {
    return this.props.type === 'recruiting';
  }

  /**
   * Update workspace details
   */
  updateDetails(data: {
    name?: string;
    icon?: string;
    color?: string;
    settings?: Record<string, unknown>;
  }): void {
    if (data.name !== undefined) {
      this.props.name = validateName(data.name);
    }
    if (data.icon !== undefined) {
      this.props.icon = data.icon;
    }
    if (data.color !== undefined) {
      this.props.color = data.color;
    }
    if (data.settings) {
      this.props.settings = { ...this.props.settings, ...data.settings };
    }
    this.touch();
  }

  /**
   * Update feature flags
   */
  updateFlags(flags: Partial<WorkspaceFlags['features']>): void {
    this.props.flags.features = { ...this.props.flags.features, ...flags };
    this.touch();
  }

  /**
   * Update order index
   */
  updateOrder(orderIndex: number): void {
    this.props.orderIndex = orderIndex;
    this.touch();
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): WorkspaceProps {
    return { ...this.props };
  }

  /**
   * Convert to response format (for API responses)
   */
  toResponse(): WorkspaceProps {
    return this.toPersistence();
  }

  /**
   * Create a new workspace
   */
  static create(data: {
    name: string;
    type: WorkspaceType;
    ownerId: string;
    icon?: string;
    color?: string;
    settings?: Record<string, unknown>;
    orderIndex?: number;
    flags?: WorkspaceFlags;
  }): Workspace {
    // Validate inputs
    const name = validateName(data.name);
    validateType(data.type);
    validateOwnerId(data.ownerId);

    // Use provided flags or defaults based on type
    const flags = data.flags ?? DEFAULT_FLAGS[data.type];

    return new Workspace({
      id: `workspace_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name,
      type: data.type,
      ownerId: data.ownerId,
      flags,
      settings: data.settings ?? {},
      icon: data.icon,
      color: data.color,
      orderIndex: data.orderIndex ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }
}

/**
 * Workspace value objects and types
 */

export interface CreateWorkspaceInput {
  name: string;
  type: WorkspaceType;
  icon?: string;
  color?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  icon?: string;
  color?: string;
  settings?: Record<string, unknown>;
  flags?: Partial<WorkspaceFlags['features']>;
}

export interface WorkspaceFilters {
  ownerId?: string;
  type?: WorkspaceType;
}
