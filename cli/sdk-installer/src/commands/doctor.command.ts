/**
 * Doctor Command
 *
 * Diagnostic tool for troubleshooting SDK installation and configuration
 */

import { loadConfig } from '../services/index.js';
import { getInstalledVersion, getVendorDir } from '../services/index.js';
import { healthCheck } from '../services/index.js';
import { detectProjectType } from '../utils/env.js';
import { header, success, error, warning, info, printList } from '../utils/cli.js';
import { existsSync } from 'fs';
import { join } from 'path';

export interface DoctorOptions {
  verbose?: boolean;
  fix?: boolean;
}

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  fix?: string;
}

/**
 * Run diagnostics
 */
async function runDiagnostics(options: DoctorOptions): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // 1. Check authentication
  const config = await loadConfig();
  if (config) {
    results.push({
      name: 'Authentication',
      status: 'pass',
      message: 'API key configured',
    });
  } else {
    results.push({
      name: 'Authentication',
      status: 'fail',
      message: 'Not authenticated',
      fix: 'Run: oxlayer login',
    });
  }

  // 2. Check API connectivity
  try {
    const isHealthy = await healthCheck();
    if (isHealthy) {
      results.push({
        name: 'API Connectivity',
        status: 'pass',
        message: 'Control Panel API is reachable',
      });
    } else {
      results.push({
        name: 'API Connectivity',
        status: 'fail',
        message: 'API health check failed',
        fix: 'Check your network connection',
      });
    }
  } catch {
    results.push({
      name: 'API Connectivity',
      status: 'fail',
      message: 'Cannot reach Control Panel API',
      fix: 'Check your network connection or API endpoint',
    });
  }

  // 3. Check project structure
  const projectConfig = await detectProjectType();
  if (projectConfig.hasPackageJson) {
    results.push({
      name: 'Project Structure',
      status: 'pass',
      message: `Found ${projectConfig.type} project with ${projectConfig.packageManager}`,
    });
  } else {
    results.push({
      name: 'Project Structure',
      status: 'warn',
      message: 'No package.json found',
      fix: 'Navigate to your project directory',
    });
  }

  // 4. Check TypeScript config
  if (projectConfig.hasTsConfig) {
    results.push({
      name: 'TypeScript',
      status: 'pass',
      message: 'TypeScript configuration found',
    });
  } else {
    results.push({
      name: 'TypeScript',
      status: 'warn',
      message: 'No TypeScript configuration found',
      fix: 'Run: npx tsc --init',
    });
  }

  // 5. Check SDK installation
  const installedVersion = await getInstalledVersion();
  if (installedVersion) {
    const vendorDir = getVendorDir(installedVersion);
    const manifestPath = join(vendorDir, 'manifest.json');

    if (existsSync(manifestPath)) {
      results.push({
        name: 'SDK Installation',
        status: 'pass',
        message: `SDK version ${installedVersion} installed`,
      });
    } else {
      results.push({
        name: 'SDK Installation',
        status: 'warn',
        message: `SDK version ${installedVersion} incomplete (missing manifest)`,
        fix: 'Run: oxlayer install --force',
      });
    }
  } else {
    results.push({
      name: 'SDK Installation',
      status: 'warn',
      message: 'No SDK installed',
      fix: 'Run: oxlayer install',
    });
  }

  // 6. Check for .gitignore
  const gitignorePath = join(process.cwd(), '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = await import('fs/promises').then(fs => fs.readFile(gitignorePath, 'utf-8'));
    const hasVendorIgnore = gitignoreContent.includes('.capabilities-vendor');

    if (hasVendorIgnore) {
      results.push({
        name: '.gitignore',
        status: 'pass',
        message: 'Vendor directory is ignored',
      });
    } else {
      results.push({
        name: '.gitignore',
        status: 'warn',
        message: 'Vendor directory not in .gitignore',
        fix: 'Add ".capabilities-vendor/" to .gitignore',
      });
    }
  } else {
    results.push({
      name: '.gitignore',
      status: 'warn',
      message: 'No .gitignore found',
      fix: 'Create .gitignore and add ".capabilities-vendor/"',
    });
  }

  // 7. Check environment variables
  if (process.env.OXLAYER_API_KEY) {
    results.push({
      name: 'Environment Variables',
      status: 'pass',
      message: 'OXLAYER_API_KEY is set',
    });
  } else if (!config) {
    results.push({
      name: 'Environment Variables',
      status: 'warn',
      message: 'No API key in environment or config',
      fix: 'Set OXLAYER_API_KEY or run: oxlayer login',
    });
  }

  // 8. Check node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion >= 18) {
    results.push({
      name: 'Node Version',
      status: 'pass',
      message: `Node ${nodeVersion} (supported)`,
    });
  } else {
    results.push({
      name: 'Node Version',
      status: 'fail',
      message: `Node ${nodeVersion} is not supported (requires >= 18)`,
      fix: 'Upgrade to Node.js 18 or later',
    });
  }

  // 9. Capability check (verbose only)
  if (options.verbose && config) {
    try {
      const { resolveCapabilities } = await import('../services/api.service.js');
      const capabilities = await resolveCapabilities(['auth', 'storage'], 'development');

      if (Object.keys(capabilities.capabilities).length > 0) {
        results.push({
          name: 'Capabilities',
          status: 'pass',
          message: `${Object.keys(capabilities.capabilities).length} capabilities available`,
        });
      } else {
        results.push({
          name: 'Capabilities',
          status: 'warn',
          message: 'No capabilities available',
          fix: 'Check your license configuration',
        });
      }
    } catch {
      results.push({
        name: 'Capabilities',
        status: 'fail',
        message: 'Could not resolve capabilities',
        fix: 'Check your API key and license',
      });
    }
  }

  return results;
}

/**
 * Print diagnostic results
 */
function printDiagnostics(results: DiagnosticResult[]): void {
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const result of results) {
    switch (result.status) {
      case 'pass':
        success(`${result.name}: ${result.message}`);
        passCount++;
        break;
      case 'warn':
        warning(`${result.name}: ${result.message}`);
        if (result.fix) {
          info(`  → ${result.fix}`);
        }
        warnCount++;
        break;
      case 'fail':
        error(`${result.name}: ${result.message}`);
        if (result.fix) {
          info(`  → ${result.fix}`);
        }
        failCount++;
        break;
    }
  }

  console.log();

  // Summary
  if (failCount === 0 && warnCount === 0) {
    success('All checks passed! Your system is properly configured.');
  } else if (failCount === 0) {
    warning(`${warnCount} warning(s) found. Consider fixing them for optimal performance.`);
  } else {
    error(`${failCount} error(s) and ${warnCount} warning(s) found. Please fix the errors.`);
  }
}

/**
 * Doctor command - run diagnostics
 */
export async function doctor(options: DoctorOptions = {}): Promise<void> {
  header('OxLayer SDK Diagnostics');

  const results = await runDiagnostics(options);

  console.log();
  printDiagnostics(results);

  // Exit with error code if there are failures
  if (results.some(r => r.status === 'fail')) {
    process.exit(1);
  }
}
