/**
 * S3 adapter types
 */

export interface S3Config {
  /**
   * Bucket name
   */
  bucket: string;
  /**
   * AWS region
   */
  region: string;
  /**
   * S3 endpoint (for S3-compatible services like MinIO)
   */
  endpoint?: string;
  /**
   * Access key ID
   */
  accessKeyId?: string;
  /**
   * Secret access key
   */
  secretAccessKey?: string;
  /**
   * Use path-style access (for MinIO)
   */
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  /**
   * Content type
   */
  contentType?: string;
  /**
   * Content encoding
   */
  contentEncoding?: string;
  /**
   * Cache control
   */
  cacheControl?: string;
  /**
   * Content disposition
   */
  contentDisposition?: string;
  /**
   * Metadata
   */
  metadata?: Record<string, string>;
  /**
   * Make file public
   */
  public?: boolean;
}

export interface UploadResult {
  /**
   * S3 key
   */
  key: string;
  /**
   * Public URL (if public)
   */
  url?: string;
  /**
   * ETag
   */
  etag?: string;
  /**
   * Version ID (if versioning enabled)
   */
  versionId?: string;
}

export interface DownloadOptions {
  /**
   * Range request (for partial downloads)
   */
  range?: string;
  /**
   * Version ID to download
   */
  versionId?: string;
}

export interface DownloadResult {
  /**
   * File content
   */
  body: Uint8Array | Buffer | string;
  /**
   * Content type
   */
  contentType?: string;
  /**
   * Content length
   */
  contentLength?: number;
  /**
   * ETag
   */
  etag?: string;
  /**
   * Last modified
   */
  lastModified?: Date;
  /**
   * Metadata
   */
  metadata?: Record<string, string>;
}

export interface PresignedUrlOptions {
  /**
   * URL expiration in seconds
   */
  expiresIn?: number;
  /**
   * Response headers override
   */
  responseHeaders?: {
    contentType?: string;
    contentDisposition?: string;
    cacheControl?: string;
  };
}

export interface ListOptions {
  /**
   * Key prefix to filter
   */
  prefix?: string;
  /**
   * Delimiter for grouping
   */
  delimiter?: string;
  /**
   * Maximum number of keys to return
   */
  maxKeys?: number;
  /**
   * Continuation token for pagination
   */
  continuationToken?: string;
}

export interface ListResult {
  /**
   * List of objects
   */
  objects: Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>;
  /**
   * Common prefixes (folders)
   */
  commonPrefixes: string[];
  /**
   * Is truncated?
   */
  isTruncated: boolean;
  /**
   * Next continuation token
   */
  nextContinuationToken?: string;
}
