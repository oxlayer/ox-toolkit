/**
 * Unit Tests for Lead Entity
 *
 * Tests Lead entity - known contacts with commercial/intent.
 * Core invariant: Lead ⊂ Contact (Lead is a contextual state of Contact).
 *
 * Progressive flow: Contact → Lead → User
 *
 * @example
 * Contact shows interest → Becomes Lead
 * Lead reaches high intent → Qualified for conversion
 * Protected action → Convert to User (Keycloak)
 */

import { describe, it, expect } from 'bun:test';
import { Lead, LeadStatus, LeadChannel } from '../../domain/identity.template';

describe('Lead Entity', () => {
  describe('Creation and Initial State', () => {
    it('should create lead with contact information', () => {
      const lead = Lead.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+15551234567',
        channel: 'web',
        source: 'organic',
      });

      expect(lead.id).toBeDefined();
      expect(lead.name).toBe('John Doe');
      expect(lead.email).toBe('john@example.com');
      expect(lead.phone).toBe('+15551234567');
      expect(lead.status).toBe('new');
      expect(lead.channel).toBe('web');
      expect(lead.source).toBe('organic');
    });

    it('should create lead with minimal information', () => {
      const lead = Lead.create({
        channel: 'whatsapp',
        phone: '+15551234567',
      });

      expect(lead.id).toBeDefined();
      expect(lead.status).toBe('new');
      expect(lead.channel).toBe('whatsapp');
      expect(lead.phone).toBe('+15551234567');
      expect(lead.email).toBeUndefined();
      expect(lead.intentScore).toBe(0);
    });

    it('should initialize with zero intent score', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      expect(lead.intentScore).toBe(0);
      expect(lead.canConvert).toBe(false);
    });
  });

  describe('Lead Status Progression', () => {
    it('should progress from new to contacted', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      expect(lead.status).toBe('new');

      lead.contact();
      expect(lead.status).toBe('contacted');
    });

    it('should progress from contacted to engaged when showing intent', () => {
      const lead = Lead.create({
        channel: 'whatsapp',
        phone: '+15551234567',
      });

      lead.contact();
      expect(lead.status).toBe('contacted');

      lead.recordIntent('request_demo', { product_id: 'prod_123' });
      expect(lead.status).toBe('engaged');
    });

    it('should qualify lead when intent score is high enough', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      // Record multiple intent signals
      lead.recordIntent('view_pricing');
      lead.recordIntent('request_demo');
      lead.recordIntent('start_checkout');
      lead.recordIntent('add_to_cart');

      // Should auto-qualify based on intent score
      expect(lead.intentScore).toBeGreaterThan(0);
      expect(lead.canConvert).toBe(true);
    });

    it('should not qualify lead with low intent', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'low.intent@example.com',
      });

      lead.recordIntent('view_pricing');

      // Intent too low
      expect(lead.intentScore).toBeLessThan(50);
    });

    it('should convert lead to user state', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      // Build up intent
      lead.recordIntent('view_pricing');
      lead.recordIntent('request_demo');
      lead.recordIntent('start_checkout');

      // Initiate conversion
      const contactMethod = lead.initiateConversion();

      expect(lead.status).toBe('converting');
      expect(contactMethod).toBe('email'); // Prefer email
      expect(lead.keycloakUserId).toBeUndefined(); // Not created yet
    });

    it('should complete conversion to user', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      lead.recordIntent('start_checkout');
      lead.initiateConversion();

      // Simulate Keycloak user creation
      const keycloakUserId = 'kc_123';
      const appUserId = 'user_456';

      lead.completeConversion(keycloakUserId, appUserId);

      expect(lead.status).toBe('converted');
      expect(lead.keycloakUserId).toBe(keycloakUserId);
      expect(lead.appUserId).toBe(appUserId);
      expect(lead.isConverted).toBe(true);
    });

    it('should mark lead as lost', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'unresponsive@example.com',
      });

      lead.contact();
      lead.lost('Not interested');

      expect(lead.status).toBe('lost');
      expect(lead.canConvert).toBe(false);
    });
  });

  describe('Intent Tracking', () => {
    it('should record intent signals', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      lead.recordIntent('view_pricing', { page: '/pricing' });
      lead.recordIntent('request_demo', { form_id: 'demo_form' });

      expect(lead.intentScore).toBe(20); // 10 + 10
      expect(lead.props.intentSignals).toHaveLength(2);
    });

    it('should track last intent timestamp', async () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      lead.recordIntent('view_pricing');
      const firstIntentAt = lead.props.lastIntentAt;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      lead.recordIntent('request_demo');
      const secondIntentAt = lead.props.lastIntentAt;

      expect(secondIntentAt.getTime()).toBeGreaterThan(firstIntentAt.getTime());
    });

    it('should cap intent score at 100', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      // Add lots of intent
      for (let i = 0; i < 20; i++) {
        lead.recordIntent('view_pricing');
      }

      expect(lead.intentScore).toBeLessThanOrEqual(100);
    });

    it('should record different intent types with appropriate scores', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      lead.recordIntent('view_pricing', {}, 5);  // Low intent
      lead.recordIntent('start_checkout', {}, 30);  // High intent
      lead.recordIntent('add_to_cart', {}, 20);  // Medium intent

      expect(lead.intentScore).toBe(55); // 5 + 30 + 20
      expect(lead.props.intentSignals).toHaveLength(3);
    });

    it('should track last contact timestamp', () => {
      const lead = Lead.create({
        channel: 'whatsapp',
        phone: '+15551234567',
      });

      lead.recordIntent('initiate_conversation');
      const lastContactAt = lead.props.lastContactAt;

      expect(lastContactAt).toBeDefined();
      expect(lastContactAt).toBeInstanceOf(Date);
    });
  });

  describe('Contact Information Management', () => {
    it('should update contact information', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'old@example.com',
      });

      lead.updateContact({
        name: 'Updated Name',
        email: 'new@example.com',
        phone: '+15551234567',
      });

      expect(lead.name).toBe('Updated Name');
      expect(lead.email).toBe('new@example.com');
      expect(lead.phone).toBe('+15551234567');
    });

    it('should track UTM parameters', () => {
      const utm = {
        source: 'google',
        medium: 'cpc',
        campaign: 'spring_sale',
        term: 'running shoes',
        content: 'banner_ad',
      };

      const lead = Lead.create({
        channel: 'web',
        email: 'utm@example.com',
        utm,
      });

      expect(lead.props.utm).toEqual(utm);
    });

    it('should track referrer', () => {
      const referrer = 'https://example.com/blog/article';

      const lead = Lead.create({
        channel: 'web',
        email: 'referred@example.com',
        referrer,
      });

      expect(lead.referrer).toBe(referrer);
    });
  });

  describe('Conversion Readiness', () => {
    it('should not be convertible without contact info', () => {
      const lead = Lead.create({
        channel: 'web',
        // No email or phone
      });

      lead.recordIntent('view_pricing');
      lead.recordIntent('request_demo');

      expect(lead.canConvert).toBe(false);
    });

    it('should be convertible with high intent and contact info', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'ready@example.com',
      });

      // Add high-intent actions
      lead.recordIntent('view_pricing');
      lead.recordIntent('request_demo');
      lead.recordIntent('start_checkout');

      expect(lead.canConvert).toBe(true);
    });

    it('should determine preferred contact method', () => {
      const emailLead = Lead.create({
        channel: 'web',
        email: 'email@example.com',
      });

      expect(emailLead.contactMethod).toBe('email');

      const phoneLead = Lead.create({
        channel: 'whatsapp',
        phone: '+15551234567',
      });

      expect(phoneLead.contactMethod).toBe('phone');

      const bothLead = Lead.create({
        channel: 'web',
        email: 'both@example.com',
        phone: '+15551234567',
      });

      expect(bothLead.contactMethod).toBe('both');
    });
  });

  describe('Channel-specific Behavior', () => {
    it('should create web channel lead', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'web@example.com',
        source: 'organic',
      });

      expect(lead.channel).toBe('web');
      expect(lead.source).toBe('organic');
    });

    it('should create WhatsApp lead', () => {
      const lead = Lead.create({
        channel: 'whatsapp',
        phone: '+15551234567',
        source: 'inbound_message',
      });

      expect(lead.channel).toBe('whatsapp');
      expect(lead.source).toBe('inbound_message');
    });

    it('should create email lead', () => {
      const lead = Lead.create({
        channel: 'email',
        email: 'email@example.com',
        source: 'newsletter',
      });

      expect(lead.channel).toBe('email');
    });

    it('should create SMS lead', () => {
      const lead = Lead.create({
        channel: 'sms',
        phone: '+15551234567',
        source: 'sms_campaign',
      });

      expect(lead.channel).toBe('sms');
    });

    it('should create referral lead', () => {
      const lead = Lead.create({
        channel: 'referral',
        email: 'referred@example.com',
        source: 'word_of_mouth',
      });

      expect(lead.channel).toBe('referral');
    });
  });

  describe('Protected Actions and Conversion', () => {
    it('should require qualification before conversion', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      // Try to convert without qualification
      expect(() => lead.initiateConversion()).toThrow();
    });

    it('should initiate conversion when qualified', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'qualified@example.com',
      });

      // Qualify the lead
      lead.qualify();

      expect(lead.status).toBe('qualified');
      expect(lead.canConvert).toBe(true);

      // Now can initiate conversion
      const method = lead.initiateConversion();

      expect(method).toBe('email');
      expect(lead.status).toBe('converting');
    });

    it('should track conversion metadata', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'user@example.com',
      });

      lead.recordIntent('start_checkout');
      lead.qualify();
      lead.initiateConversion();

      const keycloakUserId = 'kc_123';
      const appUserId = 'user_456';

      lead.completeConversion(keycloakUserId, appUserId);

      expect(lead.keycloakUserId).toBe(keycloakUserId);
      expect(lead.appUserId).toBe(appUserId);
      expect(lead.props.convertedAt).toBeDefined();
    });
  });

  describe('Persistence and Rehydration', () => {
    it('should serialize to persistence format', () => {
      const lead = Lead.create({
        name: 'Test Lead',
        email: 'lead@example.com',
        phone: '+15551234567',
        channel: 'whatsapp',
        source: 'inbound',
      });

      lead.recordIntent('view_pricing');
      lead.contact();

      const persisted = lead.toPersistence();

      expect(persisted.id).toBeDefined();
      expect(persisted.name).toBe('Test Lead');
      expect(persisted.email).toBe('lead@example.com');
      expect(persisted.status).toBe('contacted');
      expect(persisted.intentScore).toBe(10);
    });

    it('should rehydrate from persistence format', () => {
      const props = {
        id: 'lead_123',
        name: 'Rehydrated Lead',
        email: 'rehydrated@example.com',
        status: 'qualified' as LeadStatus,
        channel: 'web' as LeadChannel,
        intentScore: 75,
        intentSignals: [
          {
            type: 'view_pricing' as const,
            timestamp: new Date('2024-01-01'),
            score: 15,
          },
          {
            type: 'request_demo' as const,
            timestamp: new Date('2024-01-02'),
            score: 30,
          },
        ],
        createdAt: new Date('2024-01-01'),
        lastContactAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03'),
      };

      const lead = Lead.fromPersistence(props);

      expect(lead.id).toBe('lead_123');
      expect(lead.name).toBe('Rehydrated Lead');
      expect(lead.email).toBe('rehydrated@example.com');
      expect(lead.status).toBe('qualified');
      expect(lead.intentScore).toBe(75);
      expect(lead.canConvert).toBe(true);
    });
  });

  describe('Real-World Progressive Flow Scenarios', () => {
    it('should handle web → lead → user flow', () => {
      // 1. Anonymous user browses (not tested here)
      // 2. User provides email → Lead created
      const lead = Lead.create({
        channel: 'web',
        email: 'webuser@example.com',
        source: 'newsletter',
      });

      expect(lead.status).toBe('new');

      // 3. User shows intent
      lead.recordIntent('view_pricing');
      lead.recordIntent('request_demo');

      // 4. Auto-qualifies
      expect(lead.canConvert).toBe(true);

      // 5. User tries checkout (protected action)
      lead.initiateConversion();

      expect(lead.status).toBe('converting');

      // 6. User verifies email → Complete conversion
      lead.completeConversion('kc_abc', 'user_xyz');

      expect(lead.status).toBe('converted');
      expect(lead.isConverted).toBe(true);
    });

    it('should handle WhatsApp → lead → user flow', () => {
      // 1. User messages on WhatsApp
      const lead = Lead.create({
        channel: 'whatsapp',
        phone: '+15559998888',
        source: 'inbound_message',
      });

      // 2. Conversation progresses
      lead.recordIntent('initiate_conversation');
      lead.recordIntent('request_info');

      // 3. Qualify and convert
      lead.qualify();
      expect(lead.canConvert).toBe(true);

      const method = lead.initiateConversion();
      expect(method).toBe('phone'); // Prefer phone for WhatsApp

      // 4. User verifies OTP
      lead.completeConversion('kc_whatsapp', 'user_whatsapp');

      expect(lead.isConverted).toBe(true);
    });

    it('should handle lead nurturing before conversion', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'nurture@example.com',
      });

      // Initial interest
      lead.recordIntent('view_pricing');
      expect(lead.intentScore).toBe(10);

      lead.contact();
      expect(lead.status).toBe('contacted');

      // More engagement over time
      lead.recordIntent('download_catalog');
      lead.recordIntent('view_case_studies');
      expect(lead.intentScore).toBe(30);

      lead.qualify();
      expect(lead.status).toBe('qualified');
      expect(lead.canConvert).toBe(true);

      // Finally converts
      lead.initiateConversion();
      lead.completeConversion('kc_nurture', 'user_nurture');

      expect(lead.isConverted).toBe(true);
    });

    it('should handle lost lead that later converts', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'lost_then_found@example.com',
      });

      // Initially engaged
      lead.contact();
      lead.recordIntent('view_pricing');

      // Goes cold
      lead.lost('Stopped responding');
      expect(lead.status).toBe('lost');
      expect(lead.canConvert).toBe(false);

      // Re-engages
      lead.recordIntent('initiate_conversation');
      lead.recordIntent('high_intent_action');

      lead.qualify();
      expect(lead.canConvert).toBe(true);

      // Converts
      lead.initiateConversion();
      lead.completeConversion('kc_returning', 'user_returning');

      expect(lead.isConverted).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle lead with only email', () => {
      const lead = Lead.create({
        channel: 'email',
        email: 'only.email@example.com',
      });

      expect(lead.email).toBe('only.email@example.com');
      expect(lead.phone).toBeUndefined();
      expect(lead.contactMethod).toBe('email');
    });

    it('should handle lead with only phone', () => {
      const lead = Lead.create({
        channel: 'sms',
        phone: '+15551234567',
      });

      expect(lead.phone).toBe('+15551234567');
      expect(lead.email).toBeUndefined();
      expect(lead.contactMethod).toBe('phone');
    });

    it('should handle lead with no name', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'no.name@example.com',
      });

      expect(lead.name).toBeUndefined();
      expect(lead.email).toBe('no.name@example.com');
    });

    it('should handle multiple conversion attempts', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'multiple@example.com',
      });

      lead.recordIntent('start_checkout');
      lead.qualify();

      // First conversion attempt
      lead.initiateConversion();
      expect(lead.status).toBe('converting');

      // User abandons, comes back later
      // Lead should still be in converting state or handled by business logic
      expect(lead.status).toBe('converting');
    });
  });

  describe('Lead vs Contact vs User Distinction', () => {
    it('should enforce Lead ⊂ Contact invariant', () => {
      // Lead is a contextual state of Contact
      const lead = Lead.create({
        channel: 'web',
        email: 'lead@example.com',
      });

      // Lead has:
      // ✅ Contact info (email/phone)
      // ✅ Intent tracking
      // ✅ Status progression
      // ✅ Can convert to User
      // ❌ Not yet a User

      expect(lead.email).toBeDefined();
      expect(lead.intentScore).toBeDefined();
      expect(lead.status).toBe('new');
      expect(lead.isConverted).toBe(false);
    });

    it('should distinguish from regular Contact', () => {
      // Regular Contact: participates in workflows
      // Lead: has commercial/operational intent

      const lead = Lead.create({
        channel: 'web',
        email: 'intent@example.com',
      });

      lead.recordIntent('start_checkout');

      // Lead tracks intent specifically
      expect(lead.intentScore).toBeGreaterThan(0);
      expect(lead.canConvert).toBe(false); // Not enough yet

      lead.recordIntent('add_to_cart');

      expect(lead.canConvert).toBe(true); // Now ready to convert
    });
  });

  describe('Intent Score Calculation', () => {
    it('should calculate score from multiple signals', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'scoring@example.com',
      });

      lead.recordIntent('view_pricing', {}, 10);
      expect(lead.intentScore).toBe(10);

      lead.recordIntent('request_demo', {}, 15);
      expect(lead.intentScore).toBe(25);

      lead.recordIntent('start_checkout', {}, 20);
      expect(lead.intentScore).toBe(45);
    });

    it('should auto-advance status based on intent threshold', () => {
      const lead = Lead.create({
        channel: 'web',
        email: 'auto.advance@example.com',
      });

      expect(lead.status).toBe('new');

      lead.recordIntent('view_pricing');

      // Should advance to contacted
      expect(lead.status).toBe('contacted');

      // Add more intent
      lead.recordIntent('request_demo');
      lead.recordIntent('start_checkout');

      // Should advance to engaged/qualified
      expect(lead.canConvert).toBe(true);
    });
  });
});
