import { createDefaultS3Client } from './client.js';
import type { S3Config, UploadOptions, UploadResult } from './types.js';

/**
 * S3 uploader - specialized for different upload scenarios
 */

/**
 * Upload helper with automatic key generation
 */
export async function upload(
  key: string,
  body: File | Blob | Buffer | ArrayBuffer | string,
  options?: UploadOptions & { config?: Partial<S3Config> }
): Promise<UploadResult> {
  const client = createDefaultS3Client(options?.config);
  return client.upload(key, body, options);
}

/**
 * Upload image with validation
 */
export async function uploadImage(
  folder: string,
  file: File,
  options?: UploadOptions & { config?: Partial<S3Config> }
): Promise<UploadResult> {
  const client = createDefaultS3Client(options?.config);

  // Generate unique filename
  const timestamp = new Date().toISOString().split('T')[0];
  const randomString = Math.random().toString(36).substring(2, 12);
  const extension = file.name.split('.').pop() || 'jpg';
  const key = `${folder}/${timestamp}/${randomString}.${extension}`;

  return client.uploadImage(key, file, {
    ...options,
    public: options?.public ?? true, // Images are public by default
  });
}

/**
 * Upload multiple files
 */
export async function uploadMany(
  files: Array<{ key: string; body: File | Blob | Buffer | ArrayBuffer | string; options?: UploadOptions }>,
  sharedOptions?: { config?: Partial<S3Config> }
): Promise<UploadResult[]> {
  const client = createDefaultS3Client(sharedOptions?.config);

  return Promise.all(
    files.map((file) => client.upload(file.key, file.body, file.options))
  );
}

/**
 * Upload from URL (fetches and uploads to S3)
 */
export async function uploadFromUrl(
  key: string,
  url: string,
  options?: UploadOptions & { config?: Partial<S3Config> }
): Promise<UploadResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const blob = await response.blob();
  return upload(key, blob, {
    ...options,
    contentType: blob.type || options?.contentType,
  });
}

/**
 * Upload base64 data
 */
export async function uploadBase64(
  key: string,
  base64: string,
  options?: UploadOptions & { config?: Partial<S3Config> }
): Promise<UploadResult> {
  // Extract data URL prefix if present
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/);

  if (matches) {
    const contentType = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    return upload(key, data, { ...options, contentType });
  }

  // Raw base64
  const data = Buffer.from(base64, 'base64');
  return upload(key, data, options);
}

/**
 * Generate a unique S3 key
 */
export function generateKey(options: {
  folder: string;
  filename?: string;
  extension?: string;
  prefix?: string;
}): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const randomString = Math.random().toString(36).substring(2, 12);
  const filename = options.filename || randomString;
  const extension = options.extension ? `.${options.extension}` : '';

  const parts = [options.folder, timestamp];
  if (options.prefix) {
    parts.push(options.prefix);
  }
  parts.push(`${filename}${extension}`);

  return parts.join('/');
}
