/**
 * Organization Domain Entity
 *
 * Represents an organization that can license and use SDK packages.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { BusinessRuleViolationError, ValidationError } from '@oxlayer/foundation-domain-kit';
import type { LicenseTier } from './types.js';

/**
 * Organization properties
 */
export interface OrganizationProps {
  id: string;
  name: string;
  slug: string;
  tier: LicenseTier;
  maxDevelopers: number;
  maxProjects: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation constants
 */
const MAX_NAME_LENGTH = 100;
const MIN_NAME_LENGTH = 2;
const MAX_SLUG_LENGTH = 50;
const MIN_SLUG_LENGTH = 2;
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Organization entity
 */
export class Organization extends Entity<string> {
  private props: OrganizationProps;

  private constructor(props: OrganizationProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get tier(): LicenseTier {
    return this.props.tier;
  }

  get maxDevelopers(): number {
    return this.props.maxDevelopers;
  }

  get maxProjects(): number {
    return this.props.maxProjects;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if organization can add more developers
   */
  canAddDeveloper(currentDeveloperCount: number): boolean {
    return currentDeveloperCount < this.props.maxDevelopers;
  }

  /**
   * Check if organization can create more projects
   */
  canCreateProject(currentProjectCount: number): boolean {
    return currentProjectCount < this.props.maxProjects;
  }

  /**
   * Update organization tier
   */
  updateTier(tier: LicenseTier): void {
    if (this.props.tier === tier) return;

    this.props.tier = tier;
    this.touch();
  }

  /**
   * Update organization limits
   */
  updateLimits(limits: { maxDevelopers?: number; maxProjects?: number }): void {
    if (limits.maxDevelopers !== undefined) {
      if (limits.maxDevelopers < 1) {
        throw new BusinessRuleViolationError('maxDevelopers', 'Must be at least 1');
      }
      this.props.maxDevelopers = limits.maxDevelopers;
    }

    if (limits.maxProjects !== undefined) {
      if (limits.maxProjects < 0) {
        throw new BusinessRuleViolationError('maxProjects', 'Cannot be negative');
      }
      this.props.maxProjects = limits.maxProjects;
    }

    this.touch();
  }

  /**
   * Update organization name
   */
  updateName(name: string): void {
    this.props.name = validateAndSanitizeName(name);
    this.touch();
  }

  /**
   * Update timestamp
   */
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new organization
   */
  static create(data: {
    name: string;
    slug?: string;
    tier?: LicenseTier;
    maxDevelopers?: number;
    maxProjects?: number;
  }): Organization {
    const name = validateAndSanitizeName(data.name);
    const slug = data.slug ? validateSlug(data.slug) : generateSlugFromName(name);

    return new Organization({
      id: generateId('org'),
      name,
      slug,
      tier: data.tier ?? 'starter',
      maxDevelopers: data.maxDevelopers ?? getDefaultMaxDevelopers(data.tier ?? 'starter'),
      maxProjects: data.maxProjects ?? getDefaultMaxProjects(data.tier ?? 'starter'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): OrganizationProps {
    return { ...this.props };
  }

  /**
   * Convert to response format
   */
  toResponse(): OrganizationResponse {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug,
      tier: this.props.tier,
      maxDevelopers: this.props.maxDevelopers,
      maxProjects: this.props.maxProjects,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}

/**
 * Response type for API
 */
export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  tier: LicenseTier;
  maxDevelopers: number;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validate and sanitize organization name
 */
function validateAndSanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('name', 'Name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    throw new ValidationError('name', `Name must be at least ${MIN_NAME_LENGTH} characters`);
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError('name', `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }

  return trimmed;
}

/**
 * Validate organization slug
 */
function validateSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    throw new ValidationError('slug', 'Slug is required');
  }

  const trimmed = slug.trim().toLowerCase();
  if (trimmed.length < MIN_SLUG_LENGTH) {
    throw new ValidationError('slug', `Slug must be at least ${MIN_SLUG_LENGTH} characters`);
  }

  if (trimmed.length > MAX_SLUG_LENGTH) {
    throw new ValidationError('slug', `Slug cannot exceed ${MAX_SLUG_LENGTH} characters`);
  }

  if (!SLUG_REGEX.test(trimmed)) {
    throw new ValidationError(
      'slug',
      'Slug must contain only lowercase letters, numbers, and hyphens'
    );
  }

  return trimmed;
}

/**
 * Generate slug from organization name
 */
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, MAX_SLUG_LENGTH);
}

/**
 * Get default max developers for tier
 */
function getDefaultMaxDevelopers(tier: LicenseTier): number {
  switch (tier) {
    case 'starter':
      return 5;
    case 'professional':
      return 25;
    case 'enterprise':
      return 100;
    case 'custom':
      return 10;
  }
}

/**
 * Get default max projects for tier
 */
function getDefaultMaxProjects(tier: LicenseTier): number {
  switch (tier) {
    case 'starter':
      return 3;
    case 'professional':
      return 20;
    case 'enterprise':
      return -1; // Unlimited
    case 'custom':
      return 5;
  }
}
