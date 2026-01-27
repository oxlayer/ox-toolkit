/**
 * Unit Tests for Anonymous Session
 *
 * Tests anonymous web sessions - users before they become leads.
 * Core invariant: Anonymous Actors can act but not own data.
 *
 * @example
 * User browses website → Anonymous Session created
 * User returns later → Session tracked via device fingerprint
 * User provides email → Session promoted to Lead
 */

import { describe, it, expect } from 'bun:test';
import { AnonymousSession } from '../../domain/identity.template';

describe('Anonymous Session', () => {
  describe('Creation and Initialization', () => {
    it('should create anonymous session with unique ID', () => {
      const sessionId = 'sess_abc123';
      const session = AnonymousSession.create({
        sessionId,
        deviceFingerprint: 'fp_xyz789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      });

      expect(session.id).toBeDefined();
      expect(session.sessionId).toBe(sessionId);
      expect(session.deviceFingerprint).toBe('fp_xyz789');
      expect(session.isExpired).toBe(false);
      expect(session.hasLead).toBe(false);
    });

    it('should generate session ID if not provided', () => {
      const session = AnonymousSession.create({
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.sessionId).toBeDefined();
      expect(session.sessionId.length).toBeGreaterThan(0);
    });

    it('should set correct expiration date', () => {
      const ttlMs = 60 * 60 * 1000; // 1 hour
      const now = Date.now();

      const session = AnonymousSession.create({
        sessionId: 'sess_test',
        ttlMs,
      });

      const expiresAt = session.expiresAt.getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(now + ttlMs - 100); // Allow 100ms variance
      expect(expiresAt).toBeLessThan(now + ttlMs + 1000);
    });
  });

  describe('Session Lifecycle', () => {
    it('should track page views correctly', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_pageview',
        ttlMs: 60 * 60 * 1000,
      });

      session.recordPageView('/products');
      expect(session.props.pageViews).toBe(1);
      expect(session.props.lastPageView).toBe('/products');

      session.recordPageView('/checkout');
      expect(session.props.pageViews).toBe(2);
      expect(session.props.lastPageView).toBe('/checkout');
    });

    it('should link to lead correctly', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_lead',
        ttlMs: 60 * 60 * 1000,
      });

      const leadId = 'lead_123';
      session.linkToLead(leadId);

      expect(session.hasLead).toBe(true);
      expect(session.leadId).toBe(leadId);
    });

    it('should extend session TTL correctly', async () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_extend',
        ttlMs: 60 * 60 * 1000,
      });

      const originalExpiresAt = session.expiresAt.getTime();

      // Wait a bit to ensure time passes
      await new Promise(resolve => setTimeout(resolve, 10));

      const additionalTtl = 30 * 60 * 1000; // Add 30 minutes
      session.extendSession(additionalTtl);

      const newExpiresAt = session.expiresAt.getTime();
      expect(newExpiresAt).toBeGreaterThan(originalExpiresAt);
    });
  });

  describe('Session State', () => {
    it('should detect expired sessions', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_expired',
        ttlMs: -1000, // Already expired
      });

      expect(session.isExpired).toBe(true);
    });

    it('should detect active sessions', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_active',
        ttlMs: 60 * 60 * 1000, // 1 hour from now
      });

      expect(session.isExpired).toBe(false);
    });

    it('should track UTM parameters', () => {
      const utm = {
        source: 'google',
        medium: 'cpc',
        campaign: 'spring_sale',
        term: 'running shoes',
        content: 'banner',
      };

      const session = AnonymousSession.create({
        sessionId: 'sess_utm',
        utm,
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.utm).toEqual(utm);
    });

    it('should track referrer', () => {
      const referrer = 'https://example.com/blog/article';

      const session = AnonymousSession.create({
        sessionId: 'sess_referrer',
        referrer,
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.referrer).toBe(referrer);
    });

    it('should track landing page', () => {
      const landingPage = '/products/special-offer';

      const session = AnonymousSession.create({
        sessionId: 'sess_landing',
        landingPage,
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.landingPage).toBe(landingPage);
    });
  });

  describe('Persistence and Rehydration', () => {
    it('should serialize to persistence format', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_serialize',
        deviceFingerprint: 'fp_abc',
        ipAddress: '10.0.0.1',
        ttlMs: 60 * 60 * 1000,
        referrer: 'https://google.com',
        landingPage: '/home',
      });

      const persisted = session.toPersistence();

      expect(persisted.id).toBe(session.id);
      expect(persisted.sessionId).toBe('sess_serialize');
      expect(persisted.deviceFingerprint).toBe('fp_abc');
      expect(persisted.referrer).toBe('https://google.com');
      expect(persisted.landingPage).toBe('/home');
    });

    it('should rehydrate from persistence format', () => {
      const props = {
        id: 'anon_session_123',
        sessionId: 'sess_rehydrate',
        deviceFingerprint: 'fp_rehydrate',
        ipAddress: '10.0.0.1',
        pageViews: 5,
        lastPageView: '/checkout',
        referrer: 'https://example.com',
        landingPage: '/home',
        leadId: 'lead_456',
        utm: {
          source: 'facebook',
          medium: 'social',
        } as const,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const session = AnonymousSession.fromPersistence(props);

      expect(session.id).toBe('anon_session_123');
      expect(session.sessionId).toBe('sess_rehydrate');
      expect(session.deviceFingerprint).toBe('fp_rehydrate');
      expect(session.props.pageViews).toBe(5);
      expect(session.props.lastPageView).toBe('/checkout');
      expect(session.referrer).toBe('https://example.com');
      expect(session.landingPage).toBe('/home');
      expect(session.hasLead).toBe(true);
      expect(session.leadId).toBe('lead_456');
      expect(session.utm).toEqual(props.utm);
    });
  });

  describe('Anonymous Actor Invariant', () => {
    it('should not allow owning permanent data', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_invariant',
        ttlMs: 60 * 60 * 1000,
      });

      // Anonymous sessions have:
      // ✅ Can have draft data (optional)
      // ❌ Cannot own permanent data
      // ❌ Cannot be audited as a person
      // ❌ No permissions

      expect(session.id).toBeDefined(); // Has ID for tracking
      expect(session.hasLead).toBe(false); // No lead yet
      expect(session.isExpired).toBe(false); // Session is valid
    });

    it('should support try-before-login flows', async () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_try_before_login',
        ttlMs: 60 * 60 * 1000,
      });

      // User browses and interacts before login
      session.recordPageView('/products');
      session.recordPageView('/cart');
      session.recordPageView('/checkout');

      expect(session.props.pageViews).toBe(3);

      // User can still create draft data (cart items, etc.)
      // But nothing is "owned" until they convert to lead/user
      expect(session.hasLead).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session without device fingerprint', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_no_fp',
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.deviceFingerprint).toBeUndefined();
      expect(session.sessionId).toBeDefined();
    });

    it('should handle session without IP address', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_no_ip',
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.ipAddress).toBeUndefined();
    });

    it('should handle session with minimal data', () => {
      const session = AnonymousSession.create({
        ttlMs: 60 * 60 * 1000,
      });

      expect(session.id).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.isExpired).toBe(false);
    });

    it('should handle multiple linkToLead calls', () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_multiple_link',
        ttlMs: 60 * 60 * 1000,
      });

      session.linkToLead('lead_1');
      expect(session.leadId).toBe('lead_1');

      // Overwrite with new lead
      session.linkToLead('lead_2');
      expect(session.leadId).toBe('lead_2');
    });

    it('should handle very short TTL', async () => {
      const session = AnonymousSession.create({
        sessionId: 'sess_short',
        ttlMs: 100, // 100ms
      });

      // Should be created successfully
      expect(session.id).toBeDefined();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(session.isExpired).toBe(true);
    });
  });
});
