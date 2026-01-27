/**
 * Bitwarden Secrets Manager Adapter
 *
 * Secure credential storage and retrieval for tenant resources.
 *
 * @example
 * ```ts
 * import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';
 *
 * const client = createBitwardenSecretsClient();
 * const creds = await client.getDatabaseCredentials('tenants/acme-corp/database');
 * ```
 */

export * from "./client.js";
