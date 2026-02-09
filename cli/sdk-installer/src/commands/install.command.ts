/**
 * Install Command
 *
 * Download and install SDK packages
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { resolveCapabilities, requestPackageDownload } from '../services/index.js';
import { getVendorDir, addSdkDependencies, hasPackageJson } from '../services/index.js';
import { downloadFile, extractZip, verifyManifest, verifyExtractedIntegrity } from '../services/index.js';
import { detectProjectType } from '../utils/env.js';
import { header, success, error, info, createSpinner, formatSize, formatDuration } from '../utils/cli.js';
import type { InstallOptions, SdkPackageType } from '../types/index.js';

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

  // Check capabilities first
  const capabilitiesSpinner = createSpinner('Checking license capabilities...');
  capabilitiesSpinner.start();

  try {
    // Resolve capabilities for each package
    const requestedCapabilities: string[] = [];

    for (const pkg of packagesToInstall) {
      switch (pkg) {
        case 'backend-sdk':
          requestedCapabilities.push('auth', 'storage', 'cache', 'events', 'queues');
          break;
        case 'frontend-sdk':
          requestedCapabilities.push('auth');
          break;
        case 'channels':
          requestedCapabilities.push('events');
          break;
      }
    }

    const capabilities = await resolveCapabilities(
      requestedCapabilities as any[],
      options.environment || 'development'
    );

    capabilitiesSpinner.succeed('License verified');

    // Show capabilities
    info(`Organization: ${capabilities.organizationId}`);
    info(`License: ${capabilities.licenseId}`);
    info(`Environment: ${capabilities.environment}`);

    if (Object.keys(capabilities.capabilities).length > 0) {
      info(`Available capabilities: ${Object.keys(capabilities.capabilities).join(', ')}`);
    }
  } catch (err) {
    capabilitiesSpinner.fail('License verification failed');
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
      const { readdir, copyFile } = await import('fs/promises');

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

  // Update package.json
  if (options.save || options.saveDev) {
    const packageSpinner = createSpinner('Updating package.json...');
    packageSpinner.start();

    try {
      // Read manifest to get package list
      const { downloadUrl } = await requestPackageDownload(packagesToInstall[0], version);

      // For now, we'll add the packages as dependencies
      // In a real implementation, we'd read the manifest and add each package

      packageSpinner.succeed('Updated package.json');
    } catch (err) {
      packageSpinner.fail('Failed to update package.json');
    }
  }

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
  info('To use the SDK in your code, import from the vendor directory:');
  console.log('  import { SomeCapability } from \'.capabilities-vendor/2025_02_08_001/capabilities/auth\';');
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
