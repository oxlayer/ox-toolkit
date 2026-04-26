import { S3Client as AwsS3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, HeadObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { S3Config, UploadOptions, UploadResult, DownloadOptions, DownloadResult, ListOptions, ListResult } from './types.js';

/**
 * S3 client using AWS SDK v3
 *
 * Supports AWS S3 and S3-compatible services (MinIO, R2, etc.)
 */
export class S3Client {
  private client: AwsS3Client;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region;

    this.client = new AwsS3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.accessKeyId && config.secretAccessKey ? {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      } : undefined,
      forcePathStyle: config.forcePathStyle,
    });
  }

  /**
   * Get public URL for a key
   */
  getPublicUrl(key: string): string {
    const endpoint = (this.client as any).config.endpoint;
    if (endpoint) {
      // For S3-compatible services (MinIO, R2, etc.)
      const baseUrl = endpoint.hostname || endpoint.toString().replace(/\/$/, '');
      return `${baseUrl}/${this.bucket}/${key}`;
    }
    // For AWS S3
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Upload a file to S3
   */
  async upload(
    key: string,
    body: File | Blob | Buffer | Uint8Array | ArrayBuffer | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    let bodyBytes: Uint8Array | string | Buffer;

    // Handle different body types
    if (typeof body === 'string') {
      bodyBytes = body;
    } else if (body instanceof Buffer) {
      bodyBytes = body;
    } else if (body instanceof Uint8Array) {
      bodyBytes = body;
    } else if (body instanceof ArrayBuffer) {
      bodyBytes = new Uint8Array(body);
    } else if (body instanceof Blob) {
      // This handles both Blob and File (File extends Blob)
      const arrayBuffer = await body.arrayBuffer();
      bodyBytes = new Uint8Array(arrayBuffer);
    } else {
      // Fallback for any other case
      bodyBytes = body as any;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: bodyBytes,
      ContentType: options?.contentType,
      ContentEncoding: options?.contentEncoding,
      CacheControl: options?.cacheControl,
      ContentDisposition: options?.contentDisposition,
      Metadata: options?.metadata,
      ACL: options?.public ? 'public-read' : undefined,
    });

    const response = await this.client.send(command);

    const result: UploadResult = {
      key,
      etag: response.ETag,
      versionId: response.VersionId,
    };

    if (options?.public) {
      result.url = this.getPublicUrl(key);
    }

    return result;
  }

  /**
   * Upload an image with validation
   */
  async uploadImage(
    key: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Validate image type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only images are allowed.`);
    }

    return this.upload(key, file, {
      ...options,
      contentType: file.type,
    });
  }

  /**
   * Download a file from S3
   */
  async download(key: string, options?: DownloadOptions): Promise<DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Range: options?.range,
      VersionId: options?.versionId,
    });

    try {
      const response = await this.client.send(command);

      const body = await response.Body?.transformToByteArray();
      if (!body) {
        throw new Error(`Empty response body for key: ${key}`);
      }

      return {
        body,
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        etag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  /**
   * Delete a file from S3
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
      },
    });

    await this.client.send(command);
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Copy a file within S3
   */
  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.client.send(command);
  }

  /**
   * List objects in bucket
   */
  async list(options?: ListOptions): Promise<ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: options?.prefix,
      Delimiter: options?.delimiter,
      MaxKeys: options?.maxKeys,
      ContinuationToken: options?.continuationToken,
    });

    const response = await this.client.send(command);

    return {
      objects: (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        etag: obj.ETag!,
      })),
      commonPrefixes: (response.CommonPrefixes || []).map(prefix => prefix.Prefix!),
      isTruncated: response.IsTruncated || false,
      nextContinuationToken: response.NextContinuationToken,
    };
  }

  /**
   * Get metadata for a file
   */
  async getMetadata(key: string): Promise<{ size: number; lastModified: Date; contentType?: string; etag?: string } | null> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const response = await this.client.send(command);
      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}

/**
 * Create an S3 client
 */
export function createS3Client(config: S3Config): S3Client {
  return new S3Client(config);
}

/**
 * Create default S3 client from environment variables
 *
 * Environment variables:
 * - BUCKET_NAME or AWS_BUCKET
 * - AWS_REGION (default: us-east-1)
 * - AWS_ACCESS_KEY_ID or S3_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY or S3_SECRET_ACCESS_KEY
 * - AWS_ENDPOINT or S3_ENDPOINT (for S3-compatible services)
 */
export function createDefaultS3Client(config?: Partial<S3Config>): S3Client {
  const bucket = config?.bucket || process.env.BUCKET_NAME || process.env.AWS_BUCKET;
  const region = config?.region || process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1';
  const endpoint = config?.endpoint || process.env.AWS_ENDPOINT || process.env.S3_ENDPOINT;
  const accessKeyId = config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket) {
    throw new Error('S3 bucket name is required. Set BUCKET_NAME environment variable.');
  }

  return createS3Client({
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: config?.forcePathStyle,
  });
}
