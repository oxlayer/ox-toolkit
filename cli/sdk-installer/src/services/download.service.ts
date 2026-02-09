/**
 * Download Service
 *
 * Handles downloading and verifying SDK packages
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ReleaseManifest } from '../types/index.js';

/**
 * Calculate SHA256 hash of a file
 */
export async function calculateSHA256(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Calculate SHA256 hash of a directory recursively
 */
export async function calculateDirSHA256(dirPath: string): Promise<string> {
  const hash = createHash('sha256');
  const { glob } = await import('glob');

  const files = await glob('**/*', {
    cwd: dirPath,
    nodir: true,
    absolute: false,
  });

  // Sort for consistent hashing
  files.sort();

  for (const file of files) {
    const filePath = join(dirPath, file);
    const content = await fs.readFile(filePath);
    const relativePath = file.replace(/\\/g, '/');

    hash.update(relativePath + '\0');
    hash.update(content);
  }

  return hash.digest('hex');
}

/**
 * Download a file with progress tracking
 */
export async function downloadFile(
  url: string,
  destination: string,
  onProgress?: (progress: number, total: number) => void
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const total = parseInt(response.headers.get('content-length') || '0', 10);
  let downloaded = 0;

  // Ensure directory exists
  await fs.mkdir(join(destination, '..'), { recursive: true });

  const writer = await fs.open(destination, 'w');

  try {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      await writer.write(value);
      downloaded += value.length;

      if (onProgress && total > 0) {
        onProgress(downloaded, total);
      }
    }
  } finally {
    await writer.close();
  }
}

/**
 * Verify downloaded manifest integrity
 */
export async function verifyManifest(
  manifestPath: string,
  expectedHash?: string
): Promise<ReleaseManifest> {
  const content = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(content) as ReleaseManifest;

  if (expectedHash && manifest.sha256 !== expectedHash) {
    throw new Error(
      `Manifest SHA256 mismatch. Expected ${expectedHash}, got ${manifest.sha256}`
    );
  }

  return manifest;
}

/**
 * Extract a ZIP file
 */
export async function extractZip(zipPath: string, destination: string): Promise<void> {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(zipPath);

  await fs.mkdir(destination, { recursive: true });
  zip.extractAllTo(destination, true);
}

/**
 * Verify extracted directory integrity
 */
export async function verifyExtractedIntegrity(
  extractDir: string,
  manifest: ReleaseManifest
): Promise<boolean> {
  const actualHash = await calculateDirSHA256(extractDir);
  return actualHash === manifest.sha256;
}

export default {
  calculateSHA256,
  calculateDirSHA256,
  downloadFile,
  verifyManifest,
  extractZip,
  verifyExtractedIntegrity,
};
