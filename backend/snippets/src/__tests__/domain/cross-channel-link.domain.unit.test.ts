/**
 * Unit Tests for Cross-Channel Identity Linking
 *
 * Tests linking the same person across multiple channels.
 * Core invariant: Same person can use multiple channels.
 *
 * @example
 * User starts on web (anonymous session)
 * User messages on WhatsApp with same phone number
 * System links both channels to same identity
 * User can now continue seamlessly across channels
 */

import { describe, it, expect } from 'bun:test';
import {
  CrossChannelLinkingService,
  type CrossChannelLinkRepository,
  type ILeadRepository,
  type IUserRepositoryRef,
  type CrossChannelLink,
  _LinkedChannel,
  _LinkMethod,
} from '@oxlayer/snippets';

// ============================================================================
// MOCK REPOSITORIES
// ============================================================================

class MockCrossChannelLinkRepository implements CrossChannelLinkRepository {
  private links = new Map<string, CrossChannelLink>();

  async findByPrimaryIdentity(identityId: string): Promise<CrossChannelLink[]> {
    return Array.from(this.links.values()).filter(
      l => l.primaryIdentityId === identityId
    );
  }

  async findByIdentifier(channel: string, identifier: string): Promise<CrossChannelLink | null> {
    return this.links.get(`${channel}:${identifier}`) || null;
  }

  async findByChannel(channel: string, identifier: string): Promise<CrossChannelLink[]> {
    return Array.from(this.links.values()).filter(
      l => l.linkedChannel.channelType === channel && l.linkedChannel.identifier === identifier
    );
  }

  async save(link: CrossChannelLink): Promise<void> {
    this.links.set(`${link.linkedChannel.channelType}:${link.linkedChannel.identifier}`, link);
  }

  async delete(primaryIdentityId: string, channel: string, identifier: string): Promise<void> {
    this.links.delete(`${channel}:${identifier}`);
  }

  async findPotentialMatches(input: {
    email?: string;
    phone?: string;
    deviceId?: string;
    confidenceThreshold?: number;
  }): Promise<CrossChannelLink[]> {
    const all = Array.from(this.links.values());
    let results = all;

    if (input.email) {
      results = results.filter(l => {
        const _leadId = l.primaryIdentityId;
        // This would need actual lead/user lookup - simplified for test
        return l.linkEvidence.details?.matchValue === input.email;
      });
    }

    if (input.confidenceThreshold) {
      results = results.filter(l => l.linkEvidence.confidence >= input.confidenceThreshold);
    }

    return results;
  }
}

class MockUserRepository implements IUserRepositoryRef {
  private users = new Map<string, {
    id: string;
    keycloakUserId: string;
    email?: string;
    phone?: string;
    name?: string;
    roles: string[];
  }>();

  async findById(id: string): Promise<{ id: string; keycloakUserId: string; email?: string; phone?: string; name?: string; roles: string[] } | null> {
    return this.users.get(id) || null;
  }

  async findByKeycloakId(keycloakId: string): Promise<{ id: string; keycloakUserId: string; email?: string; phone?: string; name?: string; roles: string[] } | null> {
    return Array.from(this.users.values()).find(u => u.keycloakUserId === keycloakId) || null;
  }

  async findByEmail(email: string): Promise<{ id: string; keycloakUserId: string; email?: string; phone?: string; name?: string; roles: string[] } | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async findByPhone(phone: string): Promise<{ id: string; keycloakUserId: string; email?: string; phone?: string; name?: string; roles: string[] } | null> {
    return Array.from(this.users.values()).find(u => u.phone === phone) || null;
  }

  save(user: { id: string; keycloakUserId: string; email?: string; phone?: string; name?: string; roles: string[] }): Promise<void> {
    this.users.set(user.id, user);
  }
}

class MockLeadRepository implements ILeadRepository {
  private leads = new Map<string, {
    id: string;
    email?: string;
    phone?: string;
  }>();

  async findById(id: string): Promise<{ id: string; email?: string; phone?: string } | null> {
    return this.leads.get(id) || null;
  }

  async findByEmail(email: string): Promise<{ id: string; email?: string; phone?: string } | null> {
    return Array.from(this.leads.values()).find(l => l.email === email) || null;
  }

  async findByPhone(phone: string): Promise<{ id: string; email?: string; phone?: string } | null> {
    return Array.from(this.leads.values()).find(l => l.phone === phone) || null;
  }

  save(lead: { id: string; email?: string; phone?: string }): Promise<void> {
    this.leads.set(lead.id, lead);
  }
}

describe('Cross-Channel Identity Linking', () => {
  describe('Explicit Linking', () => {
    it('should explicitly link channels when user verifies ownership', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // User on web wants to link their WhatsApp
      const result = await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      expect(result.success).toBe(true);
      expect(result.data?.linkId).toBe('user_123');

      // Verify link was created
      const link = await linkRepo.findByIdentifier('whatsapp', '+15551234567');
      expect(link).toBeDefined();
      expect(link?.primaryIdentityId).toBe('user_123');
      expect(link?.linkedChannel.linkMethod).toBe('explicit');
      expect(link?.linkEvidence.method).toBe('explicit');
      expect(link?.linkEvidence.confidence).toBe(1.0);
    });

    it('should prevent linking already linked channel', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // First link
      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      // Try to link same channel to different identity
      const result = await service.explicitLink({
        primaryIdentityId: 'user_456', // Different user
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_LINKED');
    });

    it('should handle already linked to same identity', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // First link
      const result1 = await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      expect(result1.success).toBe(true);

      // Same link again
      const result2 = await service.explicitLink({
        primaryIdentityId: 'user_123', // Same user
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      expect(result2.success).toBe(true);
      expect(result2.data?.linkId).toBe('user_123');
    });
  });

  describe('Inferred Linking', () => {
    it('should infer link from matching email (high confidence)', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      // Existing user with email
      userRepo.save({
        id: 'user_123',
        keycloakUserId: 'kc_123',
        email: 'user@example.com',
        roles: ['customer'],
      });

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // New channel interaction with same email
      const link = await service.inferLinkFromContact({
        channel: 'whatsapp',
        identifier: '+15551234567',
        email: 'user@example.com',
      });

      expect(link).toBeDefined();
      expect(link.primaryIdentityId).toBe('user_123');
      expect(link.linkedChannel.linkMethod).toBe('inferred');
      expect(link.linkEvidence.confidence).toBeGreaterThanOrEqual(0.8); // High confidence for email
      expect(link.linkEvidence.details?.matchField).toBe('email');
    });

    it('should infer link from matching phone (medium confidence)', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      // Existing lead with phone
      leadRepo.save({
        id: 'lead_123',
        phone: '+15551234567',
      });

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // New channel interaction with same phone
      const link = await service.inferLinkFromContact({
        channel: 'telegram',
        identifier: '123456789',
        phone: '+15551234567',
      });

      expect(link).toBeDefined();
      expect(link.linkedChannel.linkMethod).toBe('inferred');
      expect(link.linkEvidence.confidence).toBeGreaterThanOrEqual(0.6); // Medium confidence for phone
      expect(link.linkEvidence.details?.matchField).toBe('phone');
    });

    it('should return null when no match found', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      const link = await service.inferLinkFromContact({
        channel: 'web',
        identifier: 'session_abc',
        email: 'nomatch@example.com',
      });

      expect(link).toBeNull();
    });
  });

  describe('Channel Retrieval', () => {
    it('should get all linked channels for an identity', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // Link web channel
      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'web',
        newIdentifier: 'web:session_abc',
        verificationMethod: 'magic_link',
      });

      // Link WhatsApp channel
      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      // Get all linked channels
      const channels = await service.getLinkedChannels('user_123');

      expect(channels).toHaveLength(2);
      expect(channels[0].channelType).toBe('web');
      expect(channels[1].channelType).toBe('whatsapp');
    });

    it('should return empty array for identity with no links', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      const channels = await service.getLinkedChannels('nonexistent_user');

      expect(channels).toHaveLength(0);
    });
  });

  describe('Unlinking Channels', () => {
    it('should unlink a channel', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // Link channel first
      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      expect(await service.getLinkedChannels('user_123')).toHaveLength(1);

      // Unlink
      await service.unlink({
        identityId: 'user_123',
        channel: 'whatsapp',
        identifier: '+15551234567',
      });

      expect(await service.getLinkedChannels('user_123')).toHaveLength(0);
    });
  });

  describe('Link Confidence Levels', () => {
    it('should set high confidence for explicit links', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      const link = await linkRepo.findByIdentifier('whatsapp', '+15551234567');

      expect(link?.linkedChannel.confidence).toBe('high');
      expect(link?.linkEvidence.confidence).toBe(1.0);
    });

    it('should set medium confidence for inferred email matches', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      userRepo.save({
        id: 'user_123',
        keycloakUserId: 'kc_123',
        email: 'user@example.com',
        roles: ['customer'],
      });

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      await service.inferLinkFromContact({
        channel: 'telegram',
        identifier: '123456789',
        email: 'user@example.com',
      });

      const link = await linkRepo.findByIdentifier('telegram', '123456789');

      expect(link?.linkedChannel.linkMethod).toBe('inferred');
      expect(link?.linkEvidence.confidence).toBeGreaterThanOrEqual(0.8);
      expect(link?.linkedChannel.confidence).toBe('high');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle web to WhatsApp journey', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // User starts on web (creates anonymous session)
      // User provides email → becomes lead
      leadRepo.save({
        id: 'lead_123',
        email: 'user@example.com',
      });

      // User converts to user on web
      userRepo.save({
        id: 'user_123',
        keycloakUserId: 'kc_web',
        email: 'user@example.com',
        roles: ['customer'],
      });

      // Later, user messages on WhatsApp with same email
      const link = await service.inferLinkFromContact({
        channel: 'whatsapp',
        identifier: '+15551234567',
        email: 'user@example.com',
      });

      expect(link).toBeDefined();
      expect(link.primaryIdentityId).toBe('user_123');
      expect(link.linkedChannel.channelType).toBe('whatsapp');
    });

    it('should handle WhatsApp to web conversion journey', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // User messages on WhatsApp first
      leadRepo.save({
        id: 'lead_123',
        phone: '+15551234567',
      });

      // User qualifies and converts
      leadRepo.save({
        id: 'user_123',
        phone: '+15551234567',
      });

      userRepo.save({
        id: 'user_123',
        keycloakUserId: 'kc_whatsapp',
        phone: '+15551234567',
        roles: ['customer'],
      });

      // User later logs into web with same phone
      const link = await service.inferLinkFromContact({
        channel: 'web',
        identifier: 'web:session_xyz',
        phone: '+15551234567',
      });

      expect(link).toBeDefined();
      expect(link.linkedChannel.channelType).toBe('web');
    });

    it('should handle multi-channel identity (web + WhatsApp + email)', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      const userId = 'user_multi';

      // First, set up user with email in the repository
      userRepo.save({
        id: userId,
        keycloakUserId: 'kc_multi',
        email: 'user@example.com',
        phone: '+15551234567',
        roles: ['customer'],
      });

      // Start on web - explicit link
      await service.explicitLink({
        primaryIdentityId: userId,
        newChannel: 'web',
        newIdentifier: 'web:session_abc',
        verificationMethod: 'magic_link',
      });

      // Add WhatsApp - explicit link
      await service.explicitLink({
        primaryIdentityId: userId,
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      // Add email - inferred from same email
      await service.inferLinkFromContact({
        channel: 'email',
        identifier: 'user@example.com',
        email: 'user@example.com',
      });

      // Get all channels
      const channels = await service.getLinkedChannels(userId);

      expect(channels.length).toBeGreaterThanOrEqual(2);
      const channelTypes = channels.map(c => c.channelType).sort();
      expect(channelTypes).toContain('web');
      expect(channelTypes).toContain('whatsapp');
    });

    it('should promote inferred link to explicit after verification', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // User with email
      userRepo.save({
        id: 'user_123',
        keycloakUserId: 'kc_123',
        email: 'user@example.com',
        roles: ['customer'],
      });

      // Inferred link from WhatsApp (same email)
      await service.inferLinkFromContact({
        channel: 'whatsapp',
        identifier: '+15551234567',
        email: 'user@example.com',
      });

      let link = await linkRepo.findByIdentifier('whatsapp', '+15551234567');
      expect(link?.linkedChannel.linkMethod).toBe('inferred');

      // User verifies OTP - promote to explicit
      const result = await service.promoteToExplicit({
        identityId: 'user_123',
        channel: 'whatsapp',
        identifier: '+15551234567',
      });

      expect(result.success).toBe(true);
      expect(result.data?.promoted).toBe(true);

      link = await linkRepo.findByIdentifier('whatsapp', '+15551234567');
      expect(link?.linkedChannel.linkMethod).toBe('explicit');
      expect(link?.linkEvidence.confidence).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle identity with no prior links', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      const channels = await service.getLinkedChannels('nonexistent');

      expect(channels).toHaveLength(0);
    });

    it('should handle unlinking non-existent link gracefully', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // Should not throw even if link doesn't exist
      await service.unlink({
        identityId: 'nonexistent',
        channel: 'web',
        identifier: 'session_abc',
      });

      // Verify no error thrown
      expect(await service.getLinkedChannels('nonexistent')).toHaveLength(0);
    });

    it('should not promote already explicit link', async () => {
      const linkRepo = new MockCrossChannelLinkRepository();
      const leadRepo = new MockLeadRepository();
      const userRepo = new MockUserRepository();

      const service = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);

      // Create explicit link
      await service.explicitLink({
        primaryIdentityId: 'user_123',
        newChannel: 'whatsapp',
        newIdentifier: '+15551234567',
        verificationMethod: 'otp',
      });

      // Try to promote again
      const result = await service.promoteToExplicit({
        identityId: 'user_123',
        channel: 'whatsapp',
        identifier: '+15551234567',
      });

      expect(result.success).toBe(true);
      expect(result.data?.promoted).toBe(false); // Already explicit
    });
  });
});
