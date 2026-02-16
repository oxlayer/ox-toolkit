/**
 * Status Command
 *
 * Show current installation status and configuration
 */

import { getAuthInfo, getManifest } from '../services/device-auth.service.js';
import { getInstalledVersion } from '../services/package.service.js';
import { detectProjectType, getRecommendedPackages } from '../utils/env.js';
import { header, info, success, error, printList } from '../utils/cli.js';
import { StatusOptions } from '../types/index.js';

/**
 * Status command - show current configuration and installation status
 */
export async function status(options: StatusOptions = {}): Promise<void> {
  header('OxLayer SDK Status');

  // Check authentication
  const authInfo = await getAuthInfo();
  if (authInfo.authenticated) {
    success('Authenticated');
    info(`Organization: ${authInfo.organizationId || 'Unknown'}`);
    info(`Device: ${authInfo.deviceId || 'Unknown'}`);

    if (options.verbose && authInfo.scopes) {
      info(`Scopes: ${authInfo.scopes.join(', ')}`);
    }
    if (options.verbose && authInfo.expiresAt) {
      const expires = new Date(authInfo.expiresAt);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      info(`Expires: ${expires.toLocaleString()} (${daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : 'expired'})`);
    }
  } else {
    error('Not authenticated');
    info('Run "ox login" to authenticate');
  }

  console.log();

  // Check capabilities (if authenticated)
  if (authInfo.authenticated) {
    header('Capabilities');

    const manifest = await getManifest();
    if (manifest) {
      success(`Capability manifest loaded`);
      info(`Schema Version: ${manifest.schemaVersion}`);
      info(`License: ${manifest.licenseId}`);
      info(`Environment: ${manifest.environment}`);

      if (manifest.capabilities) {
        const capabilityCount = Object.keys(manifest.capabilities).length;
        info(`Available Capabilities: ${capabilityCount}`);

        if (options.verbose) {
          const capabilityNames = Object.keys(manifest.capabilities);
          if (capabilityNames.length > 0) {
            info('Capabilities:');
            printList(capabilityNames);
          }

          // Show manifest expiration
          const manifestExpires = new Date(manifest.expiresAt);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((manifestExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          info(`Manifest Expires: ${manifestExpires.toLocaleString()} (${daysUntilExpiry > 0 ? `in ${daysUntilExpiry} days` : 'expired'})`);
        }
      } else {
        info('No capabilities available in manifest');
      }
    } else {
      info('No capability manifest available');
      info('Run "ox install" to fetch the latest capabilities');
    }

    console.log();
  }

  // Check project
  header('Project');

  const projectConfig = await detectProjectType();
  const recommendedPackages = getRecommendedPackages(projectConfig.type);

  if (projectConfig.hasPackageJson) {
    success('package.json found');
    info(`Project type: ${projectConfig.type}`);
    info(`Package manager: ${projectConfig.packageManager}`);
    info(`TypeScript: ${projectConfig.hasTsConfig ? 'Yes' : 'No'}`);
  } else {
    error('No package.json found in current directory');
  }

  console.log();

  // Check installation
  header('Installation');

  const installedVersion = await getInstalledVersion();
  if (installedVersion) {
    success(`SDK version ${installedVersion} installed`);
    info(`Location: .ox/${installedVersion}/`);

    if (options.verbose) {
      // List installed packages
      const { existsSync } = await import('fs');
      const { join } = await import('path');

      const vendorDir = join(process.cwd(), '.ox', installedVersion);

      if (existsSync(vendorDir)) {
        const { readdir } = await import('fs/promises');
        const packages = await readdir(vendorDir, { withFileTypes: true });
        const packageNames = packages
          .filter((p) => p.isDirectory())
          .map((p) => p.name);

        if (packageNames.length > 0) {
          info('Installed packages:');
          printList(packageNames);
        }
      }
    }
  } else {
    info('No SDK installed');
    info('Run "ox install" to install the SDK');
  }

  console.log();

  // Recommendations
  if (recommendedPackages.length > 0 && !installedVersion) {
    header('Recommended');
    info('For this project, OxLayer recommends installing:');
    printList(recommendedPackages);
  }
}
