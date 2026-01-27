/**
 * Template Domain Entity
 *
 * A Template represents a message template for WhatsApp, email, or SMS.
 * Templates can contain variables for personalization and can include
 * media and buttons.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

export type TemplateType = 'whatsapp' | 'email' | 'sms';
export type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface TemplateProps {
  id: string;
  workspaceId: string;
  name: string;
  type: TemplateType;
  subject: string | null;
  body: string;
  variables: string[] | null;
  category: string | null;
  language: string;
  isActive: boolean;
  externalId: string | null;
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  workspaceId: string;
  name: string;
  type: TemplateType;
  subject?: string;
  body: string;
  variables?: string[];
  category?: string;
  language?: string;
  isActive?: boolean;
  externalId?: string;
  status?: TemplateStatus;
}

export interface UpdateTemplateInput {
  name?: string;
  type?: TemplateType;
  subject?: string;
  body?: string;
  variables?: string[];
  category?: string;
  language?: string;
  isActive?: boolean;
  externalId?: string;
  status?: TemplateStatus;
}

export interface TemplateFilters {
  workspaceId?: string;
  type?: TemplateType;
  category?: string;
  status?: TemplateStatus;
  isActive?: boolean;
}

/**
 * Template Domain Entity
 *
 * Represents a message template for communications.
 */
export class Template extends Entity<TemplateProps> {
  protected props: TemplateProps;

  constructor(props: TemplateProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): TemplateType {
    return this.props.type;
  }

  get subject(): string | null {
    return this.props.subject;
  }

  get body(): string {
    return this.props.body;
  }

  get variables(): string[] | null {
    return this.props.variables;
  }

  get category(): string | null {
    return this.props.category;
  }

  get language(): string {
    return this.props.language;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get externalId(): string | null {
    return this.props.externalId;
  }

  get status(): TemplateStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if template is ready to use
   */
  isReady(): boolean {
    return this.props.isActive && this.props.status === 'approved';
  }

  /**
   * Update template details
   */
  updateDetails(data: UpdateTemplateInput): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.type !== undefined) {
      this.props.type = data.type;
    }
    if (data.subject !== undefined) {
      this.props.subject = data.subject;
    }
    if (data.body !== undefined) {
      this.props.body = data.body;
    }
    if (data.variables !== undefined) {
      this.props.variables = data.variables;
    }
    if (data.category !== undefined) {
      this.props.category = data.category;
    }
    if (data.language !== undefined) {
      this.props.language = data.language;
    }
    if (data.isActive !== undefined) {
      this.props.isActive = data.isActive;
    }
    if (data.externalId !== undefined) {
      this.props.externalId = data.externalId;
    }
    if (data.status !== undefined) {
      this.props.status = data.status;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Template
   */
  static create(data: CreateTemplateInput & { id: string }): Template {
    return new Template({
      id: data.id,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: TemplateProps): Template {
    return new Template(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): TemplateProps {
    return { ...this.props };
  }

  /**
   * Convert to JSON for API responses
   * Called automatically by JSON.stringify()
   */
  toJSON() {
    return {
      id: this.props.id,
      workspaceId: this.props.workspaceId,
      name: this.props.name,
      type: this.props.type,
      title: this.props.subject,
      subject: this.props.subject,
      content: this.props.body,
      body: this.props.body,
      variables: this.props.variables ?? [],
      footer: null,
      media: [],
      buttons: [],
      category: this.props.category,
      language: this.props.language,
      isActive: this.props.isActive,
      externalId: this.props.externalId,
      status: this.props.status,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
