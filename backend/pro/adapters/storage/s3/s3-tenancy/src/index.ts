/**
 * Object Storage Tenancy Adapter
 *
 * Multi-tenant Object Storage storage with shared/dedicated bucket isolation.
 *
 * @example
 * ```ts
 * import { createTenancyAwareObjectStorage } from '@oxlayer/pro-adapters-object-storage-tenancy';
 *
 * const tenantObjectStorage = createTenancyAwareObjectStorage({
 *   tenantResolver,
 *   bitwardenClient,
 *   defaultEndpoint: 'https://object-storage.example.com',
 *   defaultRegion: 'us-east-1',
 * });
 *
 * const objectStorage = await tenantObjectStorage.resolve('acme-corp');
 * await objectStorage.upload('file.pdf', buffer);
 * ```
 */

export * from './tenancy-aware-object-storage.js';
