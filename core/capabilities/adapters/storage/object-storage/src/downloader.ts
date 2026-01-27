import { createDefaultS3Client } from './client.js';
import type { S3Config, DownloadOptions, DownloadResult } from './types.js';

/**
 * S3 downloader - specialized for different download scenarios
 */

/**
 * Download a file from S3
 */
export async function download(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<DownloadResult> {
  const client = createDefaultS3Client(options?.config);
  return client.download(key, options);
}

/**
 * Download as text
 */
export async function downloadAsText(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<string> {
  const result = await download(key, options);

  if (typeof result.body === 'string') {
    return result.body;
  }

  // Convert Uint8Array/Buffer to string
  const decoder = new TextDecoder();
  if (result.body instanceof Uint8Array) {
    return decoder.decode(result.body);
  }
  // Handle Buffer case
  const body = result.body as { toString?: (encoding?: string) => string };
  if (body.toString && typeof body.toString === 'function') {
    return body.toString('utf-8');
  }

  // Fallback for other types
  return String(result.body);
}

/**
 * Download as JSON
 */
export async function downloadAsJson<T = unknown>(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<T> {
  const text = await downloadAsText(key, options);
  return JSON.parse(text) as T;
}

/**
 * Download as blob
 */
export async function downloadAsBlob(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<Blob> {
  const result = await download(key, options);

  if (result.body instanceof Blob) {
    return result.body;
  }

  // Convert to ArrayBuffer first
  let arrayBuffer: ArrayBuffer;
  const body = result.body;

  if (body instanceof Uint8Array) {
    arrayBuffer = body.buffer.slice(
      body.byteOffset,
      body.byteOffset + body.byteLength
    ) as ArrayBuffer;
  } else if (body && typeof body === 'object' && 'buffer' in body && 'byteOffset' in body && 'byteLength' in body) {
    // Handle Buffer type
    const buf = body as { buffer: ArrayBufferLike; byteOffset: number; byteLength: number };
    arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } else if (typeof body === 'string') {
    arrayBuffer = new TextEncoder().encode(body).buffer;
  } else {
    // Fallback for ArrayBuffer-like types
    arrayBuffer = body as ArrayBuffer;
  }

  return new Blob([arrayBuffer], { type: result.contentType });
}

/**
 * Download as data URL
 */
export async function downloadAsDataUrl(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<string> {
  const blob = await downloadAsBlob(key, options);

  // Convert blob to base64 data URL
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('');
  const base64 = btoa(binaryString);
  return `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
}

/**
 * Download multiple files
 */
export async function downloadMany(
  keys: string[],
  sharedOptions?: { config?: Partial<S3Config> }
): Promise<Map<string, DownloadResult>> {
  const results = new Map<string, DownloadResult>();

  await Promise.all(
    keys.map(async (key) => {
      try {
        const result = await download(key, sharedOptions);
        results.set(key, result);
      } catch (error) {
        console.error(`Failed to download ${key}:`, error);
        throw error;
      }
    })
  );

  return results;
}

/**
 * Stream download (for large files)
 * Returns a readable stream
 */
export async function downloadStream(
  key: string,
  options?: DownloadOptions & { config?: Partial<S3Config> }
): Promise<ReadableStream<Uint8Array>> {
  const client = createDefaultS3Client(options?.config);
  const result = await client.download(key, options);

  // Helper to create a stream from data
  const createStream = (data: Uint8Array): ReadableStream<Uint8Array> => {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });
  };

  const body = result.body;

  // Convert the body to a stream
  if (body instanceof Uint8Array) {
    return createStream(body);
  }

  // Handle Buffer type
  if (body && typeof body === 'object' && 'buffer' in body && 'byteOffset' in body && 'byteLength' in body) {
    const buf = body as { buffer: ArrayBufferLike; byteOffset: number; byteLength: number };
    const uint8Array = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    return createStream(uint8Array);
  }

  // For string or other types, convert to Uint8Array first
  const data = typeof body === 'string'
    ? new TextEncoder().encode(body)
    : new Uint8Array(body as ArrayBufferLike);

  return createStream(data);
}
