/**
 * Onboarding Leads Repository
 */

import { OnboardingLeadEntity, OnboardingLeadStatus, OnboardingLeadUserType } from '@/domain/index.js';

export interface OnboardingLeadFilters {
  userType?: OnboardingLeadUserType;
  status?: OnboardingLeadStatus;
  categoryId?: number;
  establishmentTypeId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface OnboardingLeadRepository {
  create(entity: OnboardingLeadEntity): Promise<OnboardingLeadEntity>;
  findById(id: number): Promise<OnboardingLeadEntity | null>;
  findByEmail(email: string): Promise<OnboardingLeadEntity | null>;
  findAll(filters?: OnboardingLeadFilters): Promise<OnboardingLeadEntity[]>;
  count(filters?: OnboardingLeadFilters): Promise<number>;
  update(id: number, entity: Partial<OnboardingLeadEntity>): Promise<OnboardingLeadEntity>;
  delete(id: number): Promise<void>;
}
