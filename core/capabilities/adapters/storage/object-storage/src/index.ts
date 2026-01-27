/**
 * S3 adapter for AWS S3 and S3-compatible services (MinIO, R2, etc.)
 *
 * This adapter provides:
 * - S3Client class for direct S3 operations
 * - Upload helpers (upload, uploadImage, uploadMany, uploadFromUrl, uploadBase64)
 * - Download helpers (download, downloadAsText, downloadAsJson, downloadAsBlob, downloadAsDataUrl)
 * - Presigned URL helpers (getDownloadUrl, getUploadUrl, getPresignedUrl)
 * - Hono middleware (s3Middleware, fileUploadMiddleware, multiFileUploadMiddleware)
 *
 * @example
 * ```ts
 * import { s3Middleware, uploadImage } from '@oxlayer/capabilities-adapters/s3';
 *
 * // Use middleware
 * app.use('/api/*', s3Middleware());
 *
 * // Or use directly
 * const result = await uploadImage('avatars', file, { public: true });
 * console.log(result.url); // https://bucket.s3.region.amazonaws.com/avatars/2024-01-12/abc123.jpg
 * ```
 */

// Core types
export * from './types.js';

// S3 client
export * from './client.js';

// Upload helpers
export * from './uploader.js';

// Download helpers
export * from './downloader.js';

// Presigned URL helpers
export * from './presigned.js';

// Middleware
export * from './middleware.js';
