/**
 * Quickwit Tenancy Adapter
 *
 * Multi-tenant Quickwit search with shared/dedicated index isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareQuickwit } from '@oxlayer/pro-adapters-quickwit-tenancy';
 *
 * const tenantQuickwit = createTenancyAwareQuickwit({
 *   tenantResolver,
 *   endpoint: 'http://localhost:7280',
 * });
 *
 * const qw = await tenantQuickwit.resolve('acme-corp');
 * await qw.search('logs', 'error', { timeRange: '1h' });
 * ```
 */

export * from './tenancy-aware-quickwit.js';
