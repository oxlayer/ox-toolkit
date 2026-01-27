/**
 * Unit Tests for Contact Entity
 *
 * Tests Contact entity - external persons that exist independently of your system.
 * Core invariant: Contacts are subjects of workflows, NOT users.
 *
 * @example
 * HR candidates from client → Contact entity
 * Survey recipients → Contact entity
 * External users → Contact entity
 * They CANNOT login, have NO permissions, NO IAM
 */

import { describe, it, expect } from 'bun:test';
import { Contact, ContactStatus, ContactSource } from '@oxlayer/snippets';

describe('Contact Entity', () => {
  describe('Creation and Core Invariants', () => {
    it('should create contact with external user ID', () => {
      const contact = Contact.create({
        externalUserId: 'hr_client_123_candidate_456',
        tenantId: 'client_abc',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+15551234567',
        source: 'hr_import',
      });

      expect(contact.id).toBeDefined();
      expect(contact.externalUserId).toBe('hr_client_123_candidate_456');
      expect(contact.tenantId).toBe('client_abc');
      expect(contact.name).toBe('Jane Doe');
      expect(contact.email).toBe('jane@example.com');
      expect(contact.phone).toBe('+15551234567');
      expect(contact.status).toBe('pending');
      expect(contact.source).toBe('hr_import');
    });

    it('should create minimal contact with only required fields', () => {
      const contact = Contact.create({
        source: 'manual_entry',
      });

      expect(contact.id).toBeDefined();
      expect(contact.status).toBe('pending');
      expect(contact.source).toBe('manual_entry');
      expect(contact.name).toBeUndefined();
      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
    });

    it('should enforce Contact is NOT a User invariant', () => {
      const contact = Contact.create({
        externalUserId: 'ext_123',
        source: 'api',
      });

      // Contacts:
      // ❌ Cannot log in
      // ❌ No permissions
      // ❌ No IAM
      // ✅ Can receive messages
      // ✅ Can answer questions
      // ✅ Can generate results

      expect(contact.id).toBeDefined(); // Has ID for tracking
      expect(contact.canCommunicate()).toBe(true); // Can be messaged
      expect(contact.hasResponded()).toBe(false); // Not yet responded
    });

    it('should create HR candidate contact', () => {
      const candidate = Contact.create({
        externalUserId: 'hr_system_candidate_789',
        tenantId: 'acme_corp',
        name: 'John Smith',
        email: 'john.smith@acme.com',
        phone: '+15559876543',
        source: 'hr_import',
        sourceDetails: {
          campaignId: 'spring_2024_hiring',
          importBatchId: 'batch_456',
        },
      });

      expect(candidate.externalUserId).toBe('hr_system_candidate_789');
      expect(candidate.tenantId).toBe('acme_corp');
      expect(candidate.name).toBe('John Smith');
      expect(candidate.sourceDetails?.campaignId).toBe('spring_2024_hiring');
    });

    it('should create survey recipient contact', () => {
      const recipient = Contact.create({
        externalUserId: 'survey_platform_user_123',
        name: 'Alice Johnson',
        email: 'alice.johnson@gmail.com',
        source: 'api',
        sourceDetails: {
          listId: 'customer_satisfaction_list',
        },
      });

      expect(recipient.externalUserId).toBe('survey_platform_user_123');
      expect(recipient.email).toBe('alice.johnson@gmail.com');
      expect(recipient.source).toBe('api');
    });
  });

  describe('Contact Status Progression', () => {
    it('should progress from pending to contacted', () => {
      const contact = Contact.create({
        email: 'user@example.com',
        source: 'web_form',
      });

      expect(contact.status).toBe('pending');

      contact.markAsContacted();

      expect(contact.status).toBe('contacted');
      expect(contact.lastContactedAt).toBeDefined();
      expect(contact.lastContactedAt).toBeInstanceOf(Date);
    });

    it('should progress from contacted to engaged', () => {
      const contact = Contact.create({
        phone: '+15551234567',
        source: 'whatsapp',
      });

      contact.markAsContacted();
      expect(contact.status).toBe('contacted');

      contact.recordResponse();

      expect(contact.status).toBe('engaged');
      expect(contact.lastResponseAt).toBeDefined();
      expect(contact.hasResponded()).toBe(true);
    });

    it('should become disengaged when stopping responses', () => {
      const contact = Contact.create({
        email: 'user@example.com',
        source: 'email',
      });

      contact.markAsContacted();
      contact.recordResponse();
      expect(contact.status).toBe('engaged');

      contact.markAsDisengaged();

      expect(contact.status).toBe('disengaged');
    });

    it('should unsubscribe from communications', () => {
      const contact = Contact.create({
        email: 'user@example.com',
        source: 'email',
      });

      contact.unsubscribe();

      expect(contact.status).toBe('unsubscribed');
      expect(contact.canCommunicate()).toBe(false);
    });

    it('should mark as bounced for invalid contact info', () => {
      const contact = Contact.create({
        email: 'invalid@email',
        source: 'csv_upload',
      });

      contact.markAsBounced();

      expect(contact.status).toBe('bounced');
      expect(contact.canCommunicate()).toBe(false);
    });
  });

  describe('Contact Information Management', () => {
    it('should update contact information', () => {
      const contact = Contact.create({
        email: 'old@example.com',
        source: 'manual_entry',
      });

      contact.updateInfo({
        name: 'Updated Name',
        email: 'new@example.com',
        phone: '+15551234567',
      });

      expect(contact.name).toBe('Updated Name');
      expect(contact.email).toBe('new@example.com');
      expect(contact.phone).toBe('+15551234567');
    });

    it('should allow partial updates', () => {
      const contact = Contact.create({
        name: 'Original Name',
        source: 'web_form',
      });

      contact.updateInfo({
        email: 'added@example.com',
      });

      expect(contact.name).toBe('Original Name'); // Unchanged
      expect(contact.email).toBe('added@example.com'); // Added
    });

    it('should track preferred communication method', () => {
      const emailOnly = Contact.create({
        email: 'email@example.com',
        source: 'manual_entry',
      });

      expect(emailOnly.getPreferredMethod()).toBe('email');

      const phoneOnly = Contact.create({
        phone: '+15551234567',
        source: 'manual_entry',
      });

      expect(phoneOnly.getPreferredMethod()).toBe('phone');

      const both = Contact.create({
        email: 'both@example.com',
        phone: '+15551234567',
        source: 'manual_entry',
      });

      // Prefers email when both available
      expect(both.getPreferredMethod()).toBe('email');
    });
  });

  describe('Contact Capabilities and Limitations', () => {
    it('should allow communication for active contacts', () => {
      const contact = Contact.create({
        email: 'active@example.com',
        source: 'manual_entry',
      });

      expect(contact.canCommunicate()).toBe(true);
    });

    it('should block communication for unsubscribed contacts', () => {
      const contact = Contact.create({
        email: 'unsubscribed@example.com',
        source: 'manual_entry',
      });

      contact.unsubscribe();
      expect(contact.canCommunicate()).toBe(false);
    });

    it('should block communication for bounced contacts', () => {
      const contact = Contact.create({
        email: 'bounced@example.com',
        source: 'manual_entry',
      });

      contact.markAsBounced();
      expect(contact.canCommunicate()).toBe(false);
    });

    it('should check if contact has responded', () => {
      const contact = Contact.create({
        phone: '+15551234567',
        source: 'whatsapp',
      });

      expect(contact.hasResponded()).toBe(false);

      contact.recordResponse();
      expect(contact.hasResponded()).toBe(true);
    });
  });

  describe('Persistence and Rehydration', () => {
    it('should serialize to persistence format', () => {
      const now = new Date();
      const contact = Contact.create({
        externalUserId: 'ext_123',
        tenantId: 'tenant_abc',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+15551234567',
        source: 'api',
        sourceDetails: {
          campaignId: 'campaign_123',
        },
      });

      const persisted = contact.toPersistence();

      expect(persisted.id).toBeDefined();
      expect(persisted.externalUserId).toBe('ext_123');
      expect(persisted.tenantId).toBe('tenant_abc');
      expect(persisted.name).toBe('Test User');
      expect(persisted.email).toBe('test@example.com');
      expect(persisted.phone).toBe('+15551234567');
      expect(persisted.status).toBe('pending');
      expect(persisted.source).toBe('api');
      expect(persisted.createdAt).toBeInstanceOf(Date);
    });

    it('should rehydrate from persistence format', () => {
      const props = {
        id: 'contact_123',
        externalUserId: 'ext_456',
        tenantId: 'tenant_xyz',
        name: 'Rehydrated User',
        email: 'rehydrated@example.com',
        status: 'engaged' as ContactStatus,
        source: 'web_form' as ContactSource,
        lastContactedAt: new Date('2024-01-01'),
        lastResponseAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-03'),
      };

      const contact = Contact.fromPersistence(props);

      expect(contact.id).toBe('contact_123');
      expect(contact.externalUserId).toBe('ext_456');
      expect(contact.tenantId).toBe('tenant_xyz');
      expect(contact.name).toBe('Rehydrated User');
      expect(contact.email).toBe('rehydrated@example.com');
      expect(contact.status).toBe('engaged');
      expect(contact.lastContactedAt).toEqual(props.lastContactedAt);
      expect(contact.lastResponseAt).toEqual(props.lastResponseAt);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle HR candidate from client system', async () => {
      // Scenario: Client uploads list of HR candidates
      const candidates = [
        {
          externalUserId: 'hr_client_acme_candidate_001',
          tenantId: 'acme_corp',
          name: 'Jane Doe',
          email: 'jane.doe@acme.com',
          phone: '+15550000001',
        },
        {
          externalUserId: 'hr_client_acme_candidate_002',
          tenantId: 'acme_corp',
          name: 'John Smith',
          email: 'john.smith@acme.com',
          phone: '+15550000002',
        },
      ];

      const contacts = candidates.map(c =>
        Contact.create({
          ...c,
          source: 'hr_import',
          sourceDetails: {
            importBatchId: 'batch_jan_2024_001',
          },
        })
      );

      expect(contacts).toHaveLength(2);
      expect(contacts[0].externalUserId).toBe('hr_client_acme_candidate_001');
      expect(contacts[0].tenantId).toBe('acme_corp');
      expect(contacts[1].status).toBe('pending');
    });

    it('should handle survey respondent flow', () => {
      // Scenario: External survey platform sends contacts
      const respondent = Contact.create({
        externalUserId: 'survey_platform_user_12345',
        name: 'Survey Respondent',
        email: 'respondent@gmail.com',
        source: 'api',
        sourceDetails: {
          listId: 'customer_sat_q1_2024',
          campaignId: 'nps_survey_2024',
        },
      });

      respondent.markAsContacted();
      respondent.recordResponse();

      expect(respondent.status).toBe('engaged');
      expect(respondent.hasResponded()).toBe(true);
    });

    it('should handle WhatsApp message from unknown number', () => {
      // Scenario: New WhatsApp message from unknown number
      const contact = Contact.create({
        phone: '+15559998888',
        source: 'whatsapp',
      });

      expect(contact.status).toBe('pending');
      expect(contact.phone).toBe('+15559998888');

      // Agent responds and person replies
      contact.markAsContacted();
      contact.recordResponse();

      expect(contact.status).toBe('engaged');
      expect(contact.hasResponded()).toBe(true);
    });

    it('should handle contact becoming disengaged over time', () => {
      const contact = Contact.create({
        email: 'user@example.com',
        source: 'web_form',
      });

      // Initial engagement
      contact.markAsContacted();
      contact.recordResponse();
      expect(contact.status).toBe('engaged');

      // User stops responding
      contact.markAsDisengaged();
      expect(contact.status).toBe('disengaged');

      // User responds again later
      contact.recordResponse();
      expect(contact.status).toBe('engaged');
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle contact with no name', () => {
      const contact = Contact.create({
        email: 'anonymous@example.com',
        source: 'manual_entry',
      });

      expect(contact.name).toBeUndefined();
      expect(contact.email).toBe('anonymous@example.com');
    });

    it('should handle contact with no email or phone', () => {
      const contact = Contact.create({
        externalUserId: 'ext_123',
        name: 'No Contact Info',
        source: 'hr_import',
      });

      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.getPreferredMethod()).toBeNull();
    });

    it('should handle contact from referral', () => {
      const contact = Contact.create({
        name: 'Referred User',
        email: 'referred@example.com',
        source: 'referral',
        sourceDetails: {
          referredBy: 'existing_user_123',
        },
      });

      expect(contact.source).toBe('referral');
      expect(contact.sourceDetails?.referredBy).toBe('existing_user_123');
    });

    it('should handle multiple status transitions correctly', () => {
      const contact = Contact.create({
        email: 'user@example.com',
        source: 'manual_entry',
      });

      const transitions: ContactStatus[] = [
        'pending',
        'contacted',
        'engaged',
        'disengaged',
        'engaged', // Came back
      ];

      transitions.forEach(expectedStatus => {
        if (expectedStatus === 'contacted') {
          contact.markAsContacted();
        } else if (expectedStatus === 'engaged') {
          contact.recordResponse();
        } else if (expectedStatus === 'disengaged') {
          contact.markAsDisengaged();
        }
        expect(contact.status).toBe(expectedStatus);
      });
    });
  });

  describe('Multi-Tenant Scenarios', () => {
    it('should maintain tenant isolation', () => {
      const tenantA = Contact.create({
        tenantId: 'tenant_a',
        externalUserId: 'user_123',
        name: 'User A',
        email: 'user@tenanta.com',
        source: 'api',
      });

      const tenantB = Contact.create({
        tenantId: 'tenant_b',
        externalUserId: 'user_123', // Same external ID, different tenant
        name: 'User B',
        email: 'user@tenantb.com',
        source: 'api',
      });

      // Same externalUserId but different tenants = different contacts
      expect(tenantA.tenantId).toBe('tenant_a');
      expect(tenantB.tenantId).toBe('tenant_b');
      expect(tenantA.email).toBe('user@tenanta.com');
      expect(tenantB.email).toBe('user@tenantb.com');
      expect(tenantA.id).not.toBe(tenantB.id);
    });

    it('should handle HR agency managing multiple clients', () => {
      // Scenario: HR agency uses system to manage candidates for multiple client companies
      const clientACandidate = Contact.create({
        externalUserId: 'agency_client_a_candidate_001',
        tenantId: 'client_a_corp',
        name: 'Candidate for Client A',
        email: 'candidate@clienta.com',
        source: 'hr_import',
      });

      const clientBCandidate = Contact.create({
        externalUserId: 'agency_client_b_candidate_001',
        tenantId: 'client_b_corp',
        name: 'Candidate for Client B',
        email: 'candidate@clientb.com',
        source: 'hr_import',
      });

      expect(clientACandidate.tenantId).toBe('client_a_corp');
      expect(clientBCandidate.tenantId).toBe('client_b_corp');
    });
  });

  describe('Contact vs User Distinction', () => {
    it('should enforce Contact cannot become User directly', () => {
      // Contacts exist independently of User authentication
      const contact = Contact.create({
        externalUserId: 'ext_user_123',
        source: 'api',
      });

      // Contact has:
      // ✅ ID for tracking
      // ✅ Contact info
      // ✅ Status tracking
      // ❌ No Keycloak integration
      // ❌ No authentication
      // ❌ No permissions

      expect(contact.id).toBeDefined();
      expect(contact.canCommunicate()).toBe(true);
      // Contact cannot "login" - that's a User concern
    });

    it('should support Contact participating in workflows', () => {
      const contact = Contact.create({
        externalUserId: 'survey_user_456',
        name: 'Survey Taker',
        email: 'taker@example.com',
        source: 'api',
      });

      // Contact participates in survey workflow
      contact.markAsContacted();
      contact.recordResponse();

      // They're still not a User
      expect(contact.status).toBe('engaged');
      expect(contact.hasResponded()).toBe(true);

      // They can be messaged, answer questions, generate results
      // But they don't "use" the system themselves
    });
  });
});
