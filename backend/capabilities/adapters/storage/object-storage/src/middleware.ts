import type { Context, Next } from 'hono';
import type { S3Client } from './client.js';
import { createDefaultS3Client } from './client.js';

export interface S3Variables {
  s3: S3Client;
}

declare module 'hono' {
  interface ContextVariableMap extends S3Variables { }
}

/**
 * S3 middleware factory for Hono
 *
 * Creates a singleton S3 client and attaches it to the Hono context.
 *
 * @example
 * ```ts
 * import { s3Middleware } from '@oxlayer/capabilities-adapters/s3';
 *
 * app.use('/api/*', s3Middleware({
 *   bucket: 'my-bucket',
 *   region: 'us-east-1',
 * }));
 *
 * // Use in handlers
 * app.post('/upload', async (c) => {
 *   const s3 = c.get('s3');
 *   const file = await c.req.formData();
 *   const result = await s3.upload('path/to/file', file);
 *   return c.json({ url: result.url });
 * });
 * ```
 */
export function s3Middleware(config?: { bucket?: string; region?: string }) {
  // Create singleton client
  const client = createDefaultS3Client(config);

  return async (c: Context, next: Next) => {
    c.set('s3', client);
    await next();
  };
}

/**
 * File upload middleware helper
 *
 * Parses multipart/form-data and makes files available
 *
 * @example
 * ```ts
 * import { fileUploadMiddleware } from '@oxlayer/capabilities-adapters/s3';
 *
 * app.post('/upload', fileUploadMiddleware({
 *   fieldName: 'file',
 *   maxFileSize: 10 * 1024 * 1024, // 10MB
 *   allowedTypes: ['image/jpeg', 'image/png'],
 * }), async (c) => {
 *   const file = c.get('uploadedFile');
 *   const s3 = c.get('s3');
 *   const result = await s3.uploadImage('uploads', file);
 *   return c.json({ url: result.url });
 * });
 * ```
 */
export function fileUploadMiddleware(options: {
  /**
   * Form field name for the file
   */
  fieldName?: string;
  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number;
  /**
   * Allowed MIME types
   */
  allowedTypes?: string[];
  /**
   * Required field?
   */
  required?: boolean;
}) {
  return async (c: Context, next: Next) => {
    const fieldName = options.fieldName || 'file';

    try {
      const formData = await c.req.formData();
      const file = formData.get(fieldName);

      if (!file) {
        if (options.required) {
          return c.json({ error: `No file uploaded in field '${fieldName}'` }, 400);
        }
        return next();
      }

      if (typeof file === 'string') {
        return c.json({ error: `Field '${fieldName}' is not a file` }, 400);
      }

      // Check file size
      if (options.maxFileSize && file.size > options.maxFileSize) {
        return c.json({ error: `File too large. Max size: ${options.maxFileSize} bytes` }, 400);
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return c.json({ error: `File type '${file.type}' not allowed` }, 400);
      }

      // Store file in context for next handler
      (c as any).set('uploadedFile', file);

      await next();
    } catch (error) {
      console.error('[FileUploadMiddleware] Error:', error);
      return c.json({ error: 'Failed to parse form data' }, 400);
    }
  };
}

/**
 * Multiple file upload middleware
 *
 * @example
 * ```ts
 * import { multiFileUploadMiddleware } from '@oxlayer/capabilities-adapters/s3';
 *
 * app.post('/upload-many', multiFileUploadMiddleware({
 *   fieldName: 'files',
 *   maxFiles: 10,
 *   maxFileSize: 5 * 1024 * 1024, // 5MB
 * }), async (c) => {
 *   const files = c.get('uploadedFiles') as File[];
 *   const s3 = c.get('s3');
 *   const results = await Promise.all(
 *     files.map(file => s3.uploadImage('uploads', file))
 *   );
 *   return c.json({ files: results });
 * });
 * ```
 */
function isFile(value: unknown): value is File {
  return value instanceof File;
}

export function multiFileUploadMiddleware(options: {
  /**
   * Form field name for the files
   */
  fieldName?: string;
  /**
   * Maximum number of files
   */
  maxFiles?: number;
  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number;
  /**
   * Allowed MIME types
   */
  allowedTypes?: string[];
}) {
  return async (c: Context, next: Next) => {
    const fieldName = options.fieldName || 'files';

    try {
      const formData = await c.req.formData();
      const files: File[] = [];

      // Iterate through all form fields
      for (const [key, value] of formData.entries()) {
        if (key.startsWith(fieldName) && isFile(value)) {
          // Check file count
          if (options.maxFiles && files.length >= options.maxFiles) {
            return c.json({ error: `Too many files. Max: ${options.maxFiles}` }, 400);
          }

          // Check file size
          if (options.maxFileSize && value.size > options.maxFileSize) {
            return c.json({ error: `File '${value.name}' too large` }, 400);
          }

          // Check file type
          if (options.allowedTypes && !options.allowedTypes.includes(value.type)) {
            return c.json({ error: `File type '${value.type}' not allowed` }, 400);
          }

          files.push(value);
        }
      }

      // Store files in context
      (c as any).set('uploadedFiles', files);

      await next();
    } catch (error) {
      console.error('[MultiFileUploadMiddleware] Error:', error);
      return c.json({ error: 'Failed to parse form data' }, 400);
    }
  };
}
