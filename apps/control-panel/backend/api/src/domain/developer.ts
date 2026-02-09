/**
 * Developer Domain Entity
 *
 * Represents a developer who belongs to an organization and can use SDK packages.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { ValidationError } from '@oxlayer/foundation-domain-kit';
import type { Environment } from './types.js';

/**
 * Developer properties
 */
export interface DeveloperProps {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  environments: Environment[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation constants
 */
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Developer entity
 */
export class Developer extends Entity<string> {
  private props: DeveloperProps;

  private constructor(props: DeveloperProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get environments(): Environment[] {
    return [...this.props.environments];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if developer has access to environment
   */
  hasAccessToEnvironment(environment: Environment): boolean {
    return this.props.environments.includes(environment);
  }

  /**
   * Add environment access
   */
  addEnvironment(environment: Environment): void {
    if (this.props.environments.includes(environment)) return;

    this.props.environments.push(environment);
    this.touch();
  }

  /**
   * Remove environment access
   */
  removeEnvironment(environment: Environment): void {
    this.props.environments = this.props.environments.filter(e => e !== environment);
    this.touch();
  }

  /**
   * Update developer details
   */
  updateDetails(data: { name?: string; email?: string }): void {
    if (data.name !== undefined) {
      this.props.name = validateName(data.name);
    }
    if (data.email !== undefined) {
      this.props.email = validateEmail(data.email);
    }
    this.touch();
  }

  /**
   * Update timestamp
   */
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new developer
   */
  static create(data: {
    organizationId: string;
    name: string;
    email: string;
    environments?: Environment[];
  }): Developer {
    const name = validateName(data.name);
    const email = validateEmail(data.email);

    return new Developer({
      id: generateId('dev'),
      organizationId: data.organizationId,
      name,
      email: email.toLowerCase(),
      environments: data.environments ?? ['development'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: DeveloperProps): Developer {
    return new Developer(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): DeveloperProps {
    return { ...this.props };
  }

  /**
   * Convert to response format
   */
  toResponse(): DeveloperResponse {
    return {
      id: this.props.id,
      organizationId: this.props.organizationId,
      name: this.props.name,
      email: this.props.email,
      environments: this.props.environments,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

/**
 * Response type for API
 */
export interface DeveloperResponse {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  environments: Environment[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Validate developer name
 */
function validateName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('name', 'Name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('name', 'Name cannot be empty');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError('name', `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }

  return trimmed;
}

/**
 * Validate developer email
 */
function validateEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new ValidationError('email', 'Email is required');
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('email', 'Email cannot be empty');
  }

  if (trimmed.length > MAX_EMAIL_LENGTH) {
    throw new ValidationError('email', `Email cannot exceed ${MAX_EMAIL_LENGTH} characters`);
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    throw new ValidationError('email', 'Invalid email format');
  }

  return trimmed;
}
