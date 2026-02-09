/**
 * Status Command
 *
 * Show current installation status and configuration
 */

import { loadConfig, getInstalledVersion } from '../services/index.js';
import { detectProjectType, getRecommendedPackages } from '../utils/env.js';
import { header, info, success, error, printList } from '../utils/cli.js';

export interface StatusOptions {
  verbose?: boolean;
}

/**
 * Status command - show current configuration and installation status
 */
export async function status(options: StatusOptions = {}): Promise<void> {
  header('OxLayer SDK Status');

  // Check authentication
  const config = await loadConfig();
  if (config) {
    success('Authenticated');
    info(`Environment: ${config.environment}`);
    info(`Vendor directory: ${config.vendorDir}`);

    if (options.verbose) {
      info(`API Key: ${config.apiKey.substring(0, 12)}...`);
    }
  } else {
    error('Not authenticated');
    info('Run "oxlayer login" to authenticate');
  }

  console.log();

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
    info(`Location: .capabilities-vendor/${installedVersion}/`);

    if (options.verbose) {
      // List installed packages
      const { existsSync } = await import('fs');
      const { join } = await import('path');

      const vendorDir = join(process.cwd(), '.capabilities-vendor', installedVersion);

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
    info('Run "oxlayer install" to install the SDK');
  }

  console.log();

  // Recommendations
  if (recommendedPackages.length > 0 && !installedVersion) {
    header('Recommended');
    info('For this project, OxLayer recommends installing:');
    printList(recommendedPackages);
  }
}
