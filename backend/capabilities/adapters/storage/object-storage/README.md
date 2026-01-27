# @oxlayer/capabilities-adapters-object-storage

Object Storage adapter for AWS S3 and S3-compatible services (MinIO, R2, etc.). Provides a simplified interface for object storage with upload, download, and presigned URL generation.

## Features

- Object Storage client using Bun's native S3 API
- Upload files (single, batch, from URL, base64)
- Download files (as buffer, text, JSON, blob, data URL)
- Presigned URL generation (upload and download)
- Image upload with validation
- Hono middleware for file uploads
- Support for AWS S3 and S3-compatible services

## Installation

```bash
bun add @oxlayer/capabilities-adapters-object-storage
```

## Optional Dependencies

```bash
bun add @aws-sdk/client-object-storage
```

## Usage

### Basic Setup

```typescript
import { createDefaultS3Client } from '@oxlayer/capabilities-adapters-object-storage';

const s3 = createDefaultS3Client({
  bucket: 'my-bucket',
  region: 'us-east-1',
  accessKeyId: 'your-key',
  secretAccessKey: 'your-secret',
});

// Upload file
await s3.upload('path/to/file.pdf', fileBuffer, {
  contentType: 'application/pdf',
  public: true,
});

// Download file
const { body } = await s3.download('path/to/file.pdf');
```

### Environment Variables

```typescript
// Uses environment variables:
// BUCKET_NAME or AWS_BUCKET=my-bucket
// AWS_REGION=us-east-1
// AWS_ACCESS_KEY_ID=your-key
// AWS_SECRET_ACCESS_KEY=your-secret
// AWS_ENDPOINT=https://s3.amazonaws.com (for S3-compatible)
```

### Upload Operations

```typescript
import { upload, uploadImage, uploadMany, uploadFromUrl, uploadBase64 } from '@oxlayer/capabilities-adapters-s3';

// Upload single file
const result = await upload('documents/report.pdf', file, {
  contentType: 'application/pdf',
  public: true,
});
console.log(result.url); // https://bucket.s3.region.amazonaws.com/documents/report.pdf

// Upload image with validation
const imageResult = await uploadImage('avatars/user123.jpg', file, {
  public: true,
});

// Upload multiple files
const results = await uploadMany('documents', [file1, file2, file3]);

// Upload from URL
const urlResult = await uploadFromUrl('downloads/image.png', 'https://example.com/image.png');

// Upload base64 data
const base64Result = await uploadBase64('assets/logo.png', base64String, {
  public: true,
});
```

### Download Operations

```typescript
import {
  download,
  downloadAsText,
  downloadAsJson,
  downloadAsBlob,
  downloadAsDataUrl,
} from '@oxlayer/capabilities-adapters-s3';

// Download as buffer
const { body } = await download('documents/report.pdf');

// Download as text
const text = await downloadAsText('documents/data.txt');

// Download as JSON
const data = await downloadAsJson('documents/config.json');

// Download as blob
const blob = await downloadAsBlob('images/photo.jpg');

// Download as data URL (base64)
const dataUrl = await downloadAsDataUrl('images/icon.png');
```

### Presigned URLs

```typescript
import { getDownloadUrl, getUploadUrl, getPresignedUrl } from '@oxlayer/capabilities-adapters-s3';

// Get download URL (expires in 1 hour)
const downloadUrl = await getDownloadUrl('documents/report.pdf', {
  expiresIn: 3600,
});

// Get upload URL (expires in 15 minutes)
const uploadUrl = await getUploadUrl('uploads/new-file.pdf', {
  expiresIn: 900,
  contentType: 'application/pdf',
});

// Get generic presigned URL
const url = await getPresignedUrl('files/data.json', 'GET', {
  expiresIn: 600,
});
```

### Using Middleware

```typescript
import { s3Middleware, fileUploadMiddleware, multiFileUploadMiddleware } from '@oxlayer/capabilities-adapters-s3';
import { Hono } from 'hono';

const app = new Hono();

// Add S3 context
app.use('/api/*', s3Middleware());

// Single file upload endpoint
app.post('/upload', fileUploadMiddleware('documents', async (file, ctx) => {
  const s3 = ctx.get('s3');
  const result = await s3.upload(`documents/${file.name}`, file);
  return result.json();
}));

// Multi-file upload endpoint
app.post('/upload/multiple', multiFileUploadMiddleware('documents', async (files, ctx) => {
  const s3 = ctx.get('s3');
  const result = await s3.uploadMany('documents', files);
  return result.json();
}));
```

### S3-Compatible Services

```typescript
// MinIO
const s3 = createDefaultS3Client({
  bucket: 'my-bucket',
  endpoint: 'http://localhost:9000',
  accessKeyId: 'minioadmin',
  secretAccessKey: 'minioadmin',
});

// Cloudflare R2
const s3 = createDefaultS3Client({
  bucket: 'my-bucket',
  endpoint: 'https://your-account.r2.cloudflarestorage.com',
  accessKeyId: 'your-r2-key',
  secretAccessKey: 'your-r2-secret',
});
```

## API Reference

### `S3Client`

Main client class for S3 operations.

#### Constructor

```typescript
constructor(config: S3Config)
```

**Config:**
- `bucket` - Bucket name (required)
- `region` - AWS region (default: `'auto'`)
- `accessKeyId` - AWS access key ID
- `secretAccessKey` - AWS secret access key
- `endpoint` - S3-compatible service endpoint
- `forcePathStyle` - Use path-style URLs

#### Methods

##### `upload(key: string, body: File | Blob | Buffer | string, options?): Promise<UploadResult>`

Upload a file to S3.

##### `uploadImage(key: string, file: File, options?): Promise<UploadResult>`

Upload an image with validation (jpg, png, webp, gif, svg, bmp).

##### `download(key: string, options?): Promise<DownloadResult>`

Download a file from S3.

##### `delete(key: string): Promise<void>`

Delete a file from S3.

##### `deleteMany(keys: string[]): Promise<void>`

Delete multiple files.

##### `exists(key: string): Promise<boolean>`

Check if a file exists.

##### `copy(sourceKey: string, destinationKey: string): Promise<void>`

Copy a file within S3.

##### `list(options?): Promise<ListResult>`

List objects in bucket.

##### `getMetadata(key: string): Promise<{ size: number, lastModified: Date } | null>`

Get file metadata.

##### `getPublicUrl(key: string): string`

Get public URL for a key.

## Helper Functions

### Upload Helpers

- `upload(path, file, options?)` - Upload single file
- `uploadImage(path, file, options?)` - Upload image
- `uploadMany(path, files, options?)` - Upload multiple files
- `uploadFromUrl(path, url, options?)` - Upload from URL
- `uploadBase64(path, base64, options?)` - Upload base64 data

### Download Helpers

- `download(path, options?)` - Download as buffer
- `downloadAsText(path)` - Download as text
- `downloadAsJson<T>(path)` - Download as JSON
- `downloadAsBlob(path)` - Download as blob
- `downloadAsDataUrl(path)` - Download as data URL

### Presigned URL Helpers

- `getDownloadUrl(path, options?)` - Get download URL
- `getUploadUrl(path, options?)` - Get upload URL
- `getPresignedUrl(path, operation, options?)` - Get presigned URL

## Types

### `S3Config`

```typescript
interface S3Config {
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}
```

### `UploadOptions`

```typescript
interface UploadOptions {
  contentType?: string;
  public?: boolean;
}
```

### `UploadResult`

```typescript
interface UploadResult {
  key: string;
  url?: string;
}
```

### `DownloadResult`

```typescript
interface DownloadResult {
  body: ArrayBuffer;
  contentType?: string;
  contentLength: number;
}
```

## File Paths

File paths are organized with date prefixes by default:

```
uploads/2024-01-12/abc123-def456.pdf
documents/2024-01-12/xyz789-abc123.pdf
```

## Best Practices

1. **Use date prefixes**: Organize files by date for better performance
2. **Set content types**: Always specify correct content type
3. **Use presigned URLs**: For temporary access to private files
4. **Validate uploads**: Check file types and sizes
5. **Handle errors**: Implement retry logic for failed uploads

## License

MIT
