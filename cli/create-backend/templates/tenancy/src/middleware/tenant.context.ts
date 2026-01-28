/**
 * Tenant Context Middleware
 *
 * Extracts tenant information from the request and makes it available
 * throughout the request lifecycle via async local storage.
 */

import { Context } from 'hono';
import { createContext } from '@oxlayer/foundation-app-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';

/**
 * Tenant context type
 */
export interface TenantContext {
  tenantId: UUID;
  tenantDomain?: string;
  tenantStatus?: 'active' | 'inactive' | 'suspended';
}

/**
 * Tenant context storage key
 */
const TENANT_CONTEXT_KEY = 'tenant';

/**
 * Tenant context storage using AsyncLocalStorage
 */
const tenantContextStorage = createContext<TenantContext>(TENANT_CONTEXT_KEY);

/**
 * Get current tenant context
 */
export function getTenantContext(): TenantContext | undefined {
  return tenantContextStorage.getStore();
}

/**
 * Set tenant context (for testing/manual setting)
 */
export function setTenantContext(context: TenantContext): void {
  tenantContextStorage.set(context);
}

/**
 * Extract tenant from request headers
 *
 * Looks for tenant in:
 * 1. X-Tenant-ID header (direct tenant ID)
 * 2. X-Tenant-Domain header (tenant domain)
 * 3. Host header (subdomain-based tenancy)
 */
function extractTenantFromRequest(req: Request): { tenantId?: UUID; tenantDomain?: string } {
  // Direct tenant ID from header
  const tenantId = req.headers.get('X-Tenant-ID') as UUID | null;
  if (tenantId) {
    return { tenantId };
  }

  // Tenant domain from header
  const tenantDomain = req.headers.get('X-Tenant-Domain');
  if (tenantDomain) {
    return { tenantDomain };
  }

  // Subdomain-based tenancy (e.g., tenant1.example.com)
  const host = req.headers.get('host') || '';
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    return { tenantDomain: subdomain };
  }

  return {};
}

/**
 * Tenant context middleware factory
 *
 * Validates tenant existence and status before allowing request to proceed
 */
export function createTenantContextMiddleware(options: {
  getTenantByDomain: (domain: string) => Promise<{ id: UUID; status: string } | null>;
  getTenantById: (id: UUID) => Promise<{ domain: string; status: string } | null>;
}) {
  return async (c: Context, next: () => Promise<void>) => {
    const { tenantId, tenantDomain } = extractTenantFromRequest(c.req.raw);

    if (!tenantId && !tenantDomain) {
      return c.json({ error: 'Tenant identification required' }, 401);
    }

    let tenant: { id: UUID; domain?: string; status: string } | null = null;

    // Resolve tenant by ID or domain
    if (tenantId) {
      const result = await options.getTenantById(tenantId);
      if (result) {
        tenant = { id: tenantId, domain: result.domain, status: result.status };
      }
    } else if (tenantDomain) {
      const result = await options.getTenantByDomain(tenantDomain);
      if (result) {
        tenant = { id: result.id, domain: tenantDomain, status: result.status };
      }
    }

    if (!tenant) {
      return c.json({ error: 'Tenant not found' }, 404);
    }

    if (tenant.status !== 'active') {
      return c.json({ error: 'Tenant is not active' }, 403);
    }

    // Set tenant context for this request
    const context: TenantContext = {
      tenantId: tenant.id,
      tenantDomain: tenant.domain,
      tenantStatus: tenant.status as 'active' | 'inactive' | 'suspended',
    };

    tenantContextStorage.run(context, () => {
      c.set('tenant', context);
    });

    await next();
  };
}

/**
 * Helper to get tenant ID from context in use cases
 */
export function requireTenantId(): UUID {
  const context = getTenantContext();
  if (!context) {
    throw new Error('Tenant context not found');
  }
  return context.tenantId;
}
