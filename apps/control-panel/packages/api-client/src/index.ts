/**
 * @oxlayer/api-client
 *
 * API client for OxLayer Control Panel
 *
 * @version 0.0.1
 */

// Export fetcher and utilities
export { apiClient, API_URL, checkApiVersion, CLIENT_VERSION } from './fetcher.js';

// Export hooks
export * from './hooks/index.js';

// Re-export common types
export type { Organization, CreateOrganizationInput, UpdateOrganizationInput } from './hooks/useOrganizations.js';
