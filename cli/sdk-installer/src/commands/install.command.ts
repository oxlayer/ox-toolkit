/**
 * Install Command
 *
 * Download and install SDK packages
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { requestPackageDownload } from '../services/index.js';
import { getVendorDir, hasPackageJson } from '../services/index.js';
import { downloadFile, extractZip, verifyManifest } from '../services/index.js';
import { detectProjectType } from '../utils/env.js';
import { header, success, error, info, createSpinner, formatDuration } from '../utils/cli.js';
import type { InstallOptions, SdkPackageType } from '../types/index.js';
import { loadConfig, isTokenExpired } from '../services/device-auth.service.js';

const PACKAGE_MAP: Record<string, SdkPackageType> = {
  'backend-sdk': 'backend-sdk',
  'frontend-sdk': 'frontend-sdk',
  'cli-tools': 'cli-tools',
  'channels': 'channels',
};

/**
 * Resolve which packages to install based on project type
 */
function resolvePackagesToInstall(
  projectType: string,
  options: InstallOptions
): SdkPackageType[] {
  if (options.packages && options.packages.length > 0) {
    return options.packages;
  }

  // Default packages based on project type
  switch (projectType) {
    case 'backend':
      return ['backend-sdk'];
    case 'frontend':
      return ['frontend-sdk'];
    case 'fullstack':
      return ['backend-sdk', 'frontend-sdk'];
    default:
      return ['backend-sdk', 'frontend-sdk', 'cli-tools'];
  }
}

/**
 * Install command - download and install SDK packages
 */
export async function install(version: string, options: InstallOptions = {}): Promise<void> {
  const startTime = Date.now();

  header('OxLayer SDK Installer');

  // Check if we're in a valid project
  if (!await hasPackageJson()) {
    error('No package.json found in current directory');
    info('Navigate to your project directory before installing.');
    process.exit(1);
  }

  // Detect project type
  const projectConfig = await detectProjectType();
  info(`Project type: ${projectConfig.type}`);

  // Resolve packages to install
  const packagesToInstall = resolvePackagesToInstall(projectConfig.type, options);
  info(`Packages: ${packagesToInstall.join(', ')}`);

  // Validate authentication
  const authSpinner = createSpinner('Validating authentication...');
  authSpinner.start();

  try {
    const config = await loadConfig();

    if (!config || !config.token) {
      authSpinner.fail('Authentication required');
      error('Please run: oxlayer login');
      process.exit(1);
    }

    // Check if token is expired
    if (isTokenExpired(config)) {
      authSpinner.fail('Token expired');
      error('Your authentication token has expired. Please run: oxlayer login');
      process.exit(1);
    }

    authSpinner.succeed('Authenticated');

    // Show auth info
    info(`Organization: ${config.organizationId}`);
    info(`Device: ${config.tokenInfo?.deviceId || 'Unknown'}`);

    const expiresAt = new Date(config.tokenInfo.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    info(`Token expires: ${expiresAt.toLocaleString()} (${daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : 'expired'})`);
  } catch (err) {
    authSpinner.fail('Authentication failed');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }

  console.log();

  // Download packages
  for (const packageType of packagesToInstall) {
    const downloadSpinner = createSpinner(`Downloading ${packageType}...`);
    downloadSpinner.start();

    try {
      // Request download URL
      const { downloadUrl, expiresAt, version: resolvedVersion } = await requestPackageDownload(
        packageType,
        version
      );

      // Use resolved version if not specified
      if (!version) {
        version = resolvedVersion;
      }

      // Create temp directory for download
      const tempDir = join(process.cwd(), '.oxlayer-temp');
      await fs.mkdir(tempDir, { recursive: true });

      const zipPath = join(tempDir, `${packageType}-${version}.zip`);

      // Download with progress
      let lastProgress = 0;
      await downloadFile(
        downloadUrl,
        zipPath,
        (progress, total) => {
          const percent = Math.floor((progress / total) * 100);
          if (percent - lastProgress >= 10) {
            downloadSpinner.text = `Downloading ${packageType}... ${percent}%`;
            lastProgress = percent;
          }
        }
      );

      downloadSpinner.succeed(`Downloaded ${packageType} (${version})`);

      // Extract
      const extractSpinner = createSpinner(`Extracting ${packageType}...`);
      extractSpinner.start();

      const vendorDir = getVendorDir(version);

      // Create vendor directory
      await fs.mkdir(vendorDir, { recursive: true });

      // Extract ZIP
      await extractZip(zipPath, join(tempDir, 'extracted'));

      // Verify manifest
      const manifestPath = join(tempDir, 'extracted', 'manifest.json');
      const manifest = await verifyManifest(manifestPath);

      // Move to vendor directory
      const extractedDir = join(tempDir, 'extracted');

      // Copy package contents to vendor directory
      const { readdir } = await import('fs/promises');

      if (packageType === 'backend-sdk') {
        // Copy backend packages
        if (manifest.packages['@oxlayer/foundation-domain-kit']) {
          await copyDirectory(
            join(extractedDir, 'foundation'),
            join(vendorDir, 'foundation')
          );
        }
        if (manifest.packages['@oxlayer/capabilities-auth']) {
          await copyDirectory(
            join(extractedDir, 'capabilities'),
            join(vendorDir, 'capabilities')
          );
        }
      } else if (packageType === 'frontend-sdk') {
        // Copy frontend packages
        await copyDirectory(
          join(extractedDir, 'frontend'),
          join(vendorDir, 'frontend')
        );
      }

      extractSpinner.succeed(`Extracted ${packageType}`);

      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      downloadSpinner.fail(`Failed to install ${packageType}`);
      error(err instanceof Error ? err.message : 'Unknown error');
      process.exit(1);
    }
  }

  console.log();

  const duration = Date.now() - startTime;

  // Success
  header('Installation Complete');
  success(`SDK version ${version} installed successfully`);
  info(`Duration: ${formatDuration(duration)}`);
  info(`Vendor directory: .capabilities-vendor/${version}/`);

  // Next steps
  console.log();
  info('Next steps:');
  console.log('  Run your package manager to install dependencies:');
  console.log(`    ${projectConfig.packageManager} install`);

  console.log();
  info('To use SDK in your code, import from vendor directory:');
  console.log(`  import { SomeCapability } from '.capabilities-vendor/${version}/capabilities/auth';`);
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
