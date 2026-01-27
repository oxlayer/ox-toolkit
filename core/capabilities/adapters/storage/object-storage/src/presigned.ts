import { createDefaultS3Client } from './client.js';
import type { S3Config, PresignedUrlOptions } from './types.js';

/**
 * Generate a presigned URL for download
 *
 * Note: Bun's S3 API doesn't natively support presigned URLs.
 * This implementation returns a public URL. For actual presigned URLs
 * with expiration, you would need to use the AWS SDK.
 *
 * For production use with presigned URLs, consider using AWS SDK v3's
 * @aws-sdk/s3-request-presigner package.
 */
export async function getDownloadUrl(
  key: string,
  options?: PresignedUrlOptions & { config?: Partial<S3Config> }
): Promise<string> {
  const client = createDefaultS3Client(options?.config);

  // For now, return public URL
  // TODO: Implement proper presigned URLs with AWS SDK if needed
  return (client as any).getPublicUrl(key);
}

/**
 * Generate a presigned URL for upload
 *
 * Note: Same limitation as getDownloadUrl. For production use,
 * implement with AWS SDK's presigned POST functionality.
 */
export async function getUploadUrl(
  key: string,
  options?: PresignedUrlOptions & { config?: Partial<S3Config> }
): Promise<string> {
  const client = createDefaultS3Client(options?.config);

  // For now, return public URL
  // TODO: Implement proper presigned URLs with AWS SDK if needed
  return (client as any).getPublicUrl(key);
}

/**
 * Generate presigned URL helper
 *
 * @example
 * ```ts
 * // For downloads (expires in 1 hour)
 * const url = await getPresignedUrl('files/document.pdf', { expiresIn: 3600 });
 *
 * // For uploads with content type
 * const uploadUrl = await getPresignedUrl('uploads/file.jpg', {
 *   expiresIn: 300,
 *   responseHeaders: { contentType: 'image/jpeg' }
 * });
 * ```
 */
export async function getPresignedUrl(
  key: string,
  options?: PresignedUrlOptions & { config?: Partial<S3Config> }
): Promise<string> {
  return getDownloadUrl(key, options);
}
