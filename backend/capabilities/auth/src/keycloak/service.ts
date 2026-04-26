import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { TokenValidationResult, KeycloakConfig, KeycloakConfigUnion } from './types.js';

/**
 * Keycloak Service
 * Validates JWT tokens from Keycloak and extracts user information
 * Supports both single-realm and multi-realm configurations
 */
export class KeycloakService {
  private jwksClient: jwksClient.JwksClient;
  private config: KeycloakConfig;
  private jwksUri: string;
  private realm: string;
  private isMultiRealm: boolean;
  private realmConfigs: Record<string, KeycloakConfig>;

  constructor(config?: KeycloakConfigUnion, realm?: string) {
    // Detect if this is a multi-realm configuration
    if (config && 'realms' in config) {
      // Multi-realm mode
      this.isMultiRealm = true;
      this.realmConfigs = config.realms;
      this.realm = realm || config.defaultRealm || '';
      const realmConfig = config.realms[this.realm];
      if (!realmConfig) {
        throw new Error(`Realm "${this.realm}" not found in configuration`);
      }
      this.config = realmConfig;
    } else {
      // Single realm mode (backward compatible)
      this.isMultiRealm = false;
      this.realmConfigs = {};
      this.realm = realm || process.env.KEYCLOAK_REALM || process.env.VITE_PUBLIC_KEYCLOAK_REALM || '';
      this.config = config || {
        url: process.env.KEYCLOAK_URL || process.env.VITE_PUBLIC_KEYCLOAK_URL || '',
        realm: this.realm,
        clientId: process.env.KEYCLOAK_CLIENT_ID || process.env.VITE_PUBLIC_KEYCLOAK_CLIENT_ID,
      };
    }

    if (!this.config.url || !this.realm) {
      throw new Error('Keycloak URL and Realm must be configured');
    }

    // Initialize JWKS client for token verification
    this.jwksUri = `${this.config.url}/realms/${this.realm}/protocol/openid-connect/certs`;
    this.jwksClient = jwksClient({
      jwksUri: this.jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Get the current realm
   */
  getRealm(): string {
    return this.realm;
  }

  /**
   * Check if this service is in multi-realm mode
   */
  isMultiRealmMode(): boolean {
    return this.isMultiRealm;
  }

  /**
   * Get a service instance for a different realm (multi-realm mode only)
   */
  forRealm(realm: string): KeycloakService {
    if (!this.isMultiRealm) {
      throw new Error('Cannot switch realms: service not in multi-realm mode');
    }
    return new KeycloakService({ realms: this.realmConfigs }, realm);
  }

  /**
   * Get signing key for JWT verification
   */
  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          const errorMessage = err.message || 'Unknown error';
          if (errorMessage.includes('Not Found') || errorMessage.includes('404')) {
            return reject(new Error(`JWKS key not found. Key ID: ${kid}. Please verify KEYCLOAK_URL and KEYCLOAK_REALM are correct. JWKS URI: ${this.jwksUri}`));
          }
          return reject(new Error(`Failed to get signing key: ${errorMessage}`));
        }
        const signingKey = key?.getPublicKey();
        if (!signingKey) {
          return reject(new Error('Unable to get signing key'));
        }
        resolve(signingKey);
      });
    });
  }

  /**
   * Validate JWT token from Authorization header
   * Supports both "Bearer <token>" and raw token formats
   * Returns realm extracted from token claims
   *
   * Supports two token types:
   * 1. Keycloak-issued tokens (verified via JWKS with RS256)
   * 2. Device-issued tokens (verified via JWT_SECRET with HS256)
   */
  async validateToken(authHeader: string): Promise<TokenValidationResult> {
    try {
      // Extract token from Authorization header
      let token: string;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }

      if (!token) {
        return {
          valid: false,
          error: 'Token is missing',
        };
      }

      // Decode token to get kid (key ID) without verification
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') {
        return {
          valid: false,
          error: 'Invalid token format',
        };
      }

      const kid = decoded.header.kid;
      if (!kid) {
        return {
          valid: false,
          error: 'Token missing key ID',
        };
      }

      // Check if this is a device-issued token (uses symmetric HS256)
      const DEVICE_AUTH_KEY_ID = 'oxlayer-device-auth-key';
      const DEVICE_AUTH_SECRET = process.env.JWT_SECRET;

      if (kid === DEVICE_AUTH_KEY_ID) {
        if (!DEVICE_AUTH_SECRET) {
          return {
            valid: false,
            error: 'JWT_SECRET is not configured; cannot verify device tokens',
          };
        }
        // Device-issued token - verify with local secret
        try {
          const payload = jwt.verify(token, DEVICE_AUTH_SECRET, {
            algorithms: ['HS256'],
          }) as any;

          return {
            valid: true,
            payload: {
              sub: payload.deviceId,
              email: payload.deviceId,
              preferred_username: payload.deviceId,
              organization_id: payload.organizationId,
              realm_access: { roles: [] },
              aud: 'oxlayer-device-auth',
              iss: 'oxlayer-device-auth',
              azp: payload.organizationId,
            },
            realm: this.config.realm,
          };
        } catch (verifyError: any) {
          return {
            valid: false,
            error: `Device token verification failed: ${verifyError.message}`,
          };
        }
      }

      // Keycloak-issued token - continue with normal JWKS verification
      // Get signing key
      let signingKey: string;
      try {
        signingKey = await this.getSigningKey(kid);
      } catch (keyError: any) {
        return {
          valid: false,
          error: `Failed to get signing key: ${keyError.message}`,
        };
      }

      // Decode payload to check issuer and extract realm
      const payload = decoded.payload as any;
      const expectedIssuer = `${this.config.url}/realms/${this.config.realm}`;
      const tokenIssuer = payload.iss;

      if (tokenIssuer !== expectedIssuer) {
        return {
          valid: false,
          error: `Token issuer mismatch. Expected: ${expectedIssuer}, Got: ${tokenIssuer}`,
        };
      }

      // Verify token
      let verifiedPayload: any;
      try {
        verifiedPayload = jwt.verify(token, signingKey, {
          algorithms: ['RS256'],
          issuer: expectedIssuer,
        }) as any;
      } catch (verifyError: any) {
        return {
          valid: false,
          error: `Token verification failed: ${verifyError.message}`,
        };
      }

      // Validate client if clientId is configured AND skipClientValidation is false
      // Check both audience (aud) and authorized party (azp) claims
      // For public clients, aud is typically "account" and azp contains the client ID
      //
      // When skipClientValidation is true (recommended for resource servers):
      // - Validates by realm only - accepts tokens from any client in the same realm
      // - Authorization should be done via realm_access.roles instead
      if (this.config.clientId && !this.config.skipClientValidation) {
        const aud = Array.isArray(verifiedPayload.aud) ? verifiedPayload.aud : [verifiedPayload.aud];
        const azp = verifiedPayload.azp;

        // Token is valid if:
        // 1. Audience matches clientId, OR
        // 2. Authorized party (azp) matches clientId (for public client tokens)
        if (!aud.includes(this.config.clientId) && azp !== this.config.clientId) {
          return {
            valid: false,
            error: `Token client mismatch. Expected: ${this.config.clientId}, Got: aud=${JSON.stringify(aud)}, azp=${azp || 'none'}`,
          };
        }
      }

      // Extract realm from token (either from custom claim or issuer)
      const tokenRealm = verifiedPayload.realm || tokenIssuer?.split('/').pop();

      return {
        valid: true,
        payload: verifiedPayload,
        realm: tokenRealm,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Token validation failed',
      };
    }
  }

  /**
   * Extract organization_id from token
   * Assumes organization_id is a custom claim added via Keycloak mapper
   * Format can be:
   * - organization: { "id": "org-id" }
   * - organization: { "org-name": { "id": "uuid-string" } }
   */
  async getOrganizationIdFromToken(authHeader: string): Promise<string | null> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return null;
    }

    const payload = validation.payload;
    const organization = payload.organization;

    // New format: { "organization": { "id": "acme-corp" } }
    if (organization && typeof organization === 'object' && !Array.isArray(organization)) {
      if ('id' in organization) {
        return organization.id as string;
      }
      // Legacy format: { "organization": { "org-name": { "id": "uuid" } } }
      const firstOrg = Object.values(organization)[0];
      if (firstOrg && typeof firstOrg === 'object' && 'id' in firstOrg) {
        return (firstOrg as { id: string }).id;
      }
    }

    return null;
  }

  /**
   * Extract workspace from token
   * Format: { "workspace": { "id": "workspace-id" } }
   */
  async getWorkspaceIdFromToken(authHeader: string): Promise<string | null> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return null;
    }

    const payload = validation.payload;
    const workspace = payload.workspace;

    if (workspace && typeof workspace === 'object' && !Array.isArray(workspace)) {
      if ('id' in workspace) {
        return workspace.id as string;
      }
    }

    return null;
  }

  /**
   * Identifies the user type based on the Keycloak client (azp claim).
   *
   * Matching is configurable via env vars (comma-separated substring patterns):
   *   OXLAYER_MEMBER_AZP_PATTERNS  (default: "app")
   *   OXLAYER_STAFF_AZP_PATTERNS      (default: "people,admin")
   *
   * @returns 'member' | 'staff' | null
   */
  async getUserTypeFromToken(authHeader: string): Promise<'member' | 'staff' | null> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return null;
    }

    const azp = (validation.payload.azp || validation.payload.client_id) as string | undefined;
    if (!azp) return null;

    const memberPatterns = (process.env.OXLAYER_MEMBER_AZP_PATTERNS || 'app')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const adminPatterns = (process.env.OXLAYER_STAFF_AZP_PATTERNS || 'people,admin')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (memberPatterns.some((p) => azp.includes(p))) return 'member';
    if (adminPatterns.some((p) => azp.includes(p))) return 'staff';

    return null;
  }

  /**
   * Extract user ID from token
   */
  async getUserIdFromToken(authHeader: string): Promise<string | null> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return null;
    }

    return (validation.payload.sub as string) || null;
  }

  /**
   * Extract user email from token
   */
  async getUserEmailFromToken(authHeader: string): Promise<string | null> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return null;
    }

    const payload = validation.payload;
    return (payload.email || payload.preferred_username || null) as string | null;
  }

  /**
   * Extract user roles from token
   */
  async getUserRolesFromToken(authHeader: string): Promise<string[]> {
    const validation = await this.validateToken(authHeader);
    if (!validation.valid || !validation.payload) {
      return [];
    }

    const payload = validation.payload;
    const realmAccess = payload.realm_access as any;
    return realmAccess?.roles || [];
  }
}
