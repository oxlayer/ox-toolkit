/**
 * Install Command
 *
 * Download and install SDK packages as a local workspace
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { requestPackageDownload } from '../services/index.js';
import { hasPackageJson } from '../services/index.js';
import { downloadFile, extractZip, verifyManifest } from '../services/index.js';
import { detectProjectType, findProjectRoot, getInstallCommand, type PackageManager } from '../utils/env.js';
import { header, success, error, info, createSpinner, formatDuration } from '../utils/cli.js';
import type { InstallOptions, SdkPackageType } from '../types/index.js';
import { loadConfig, isTokenExpired } from '../services/device-auth.service.js';

const VENDOR_DIR = '.ox';

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
    default:
      return ['backend-sdk', 'frontend-sdk', 'cli-tools'];
  }
}

/**
 * Convert version format to semver-compatible format
 * e.g., 2026_02_14_001 → 2026.2.14-1
 */
function toSemverVersion(version: string): string {
  const parts = version.split('_');
  if (parts.length === 4) {
    const [year, month, day, build] = parts;
    return `${year}.${parseInt(month, 10)}.${parseInt(day, 10)}-${parseInt(build, 10)}`;
  }
  return version;
}

/**
 * Create individual package.json files for each sub-package
 * This allows importing from @oxlayer/capabilities-auth, etc.
 * Preserves existing dependencies from the SDK's package.json files.
 */
async function createSubPackageJsons(vendorVersionDir: string, manifest: any): Promise<void> {
  const semverVersion = toSemverVersion(manifest.version);

  for (const [name, pkg] of Object.entries(manifest.packages) as [string, any][]) {
    const packageDir = join(vendorVersionDir, pkg.path);
    const packageJsonPath = join(packageDir, 'package.json');

    // Read existing package.json to preserve dependencies
    let existingDeps: Record<string, string> = {};
    try {
      const existingContent = await fs.readFile(packageJsonPath, 'utf-8');
      const existingPkg = JSON.parse(existingContent);
      existingDeps = existingPkg.dependencies || {};
    } catch {
      // File doesn't exist or invalid JSON, that's okay
    }

    const packageJson = {
      name: name,
      version: semverVersion,
      private: true,
      type: 'module',
      main: pkg.main || './dist/index.js',
      dependencies: existingDeps,
      exports: {
        '.': {
          types: pkg.main?.replace('.js', '.d.ts') || './dist/index.d.ts',
          default: pkg.main || './dist/index.js'
        },
        './package.json': './package.json'
      }
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  }
}

/**
 * Update or create pnpm-workspace.yaml to include vendor directory
 */
async function updateWorkspaceConfig(rootDir: string): Promise<void> {
  const workspacePath = join(rootDir, 'pnpm-workspace.yaml');
  // Workspace patterns
  const includePattern = '.ox/**';
  const excludePattern = '!.ox/**/node_modules/**';

  let workspaceConfig: { packages?: string[] };

  try {
    const content = await fs.readFile(workspacePath, 'utf-8');
    // Parse YAML (simple version, just extract packages array)
    const match = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n*)+)/);
    if (match) {
      const packages = match[1].split('\n')
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(line => line.length > 0);
      workspaceConfig = { packages };
    } else {
      workspaceConfig = { packages: [] };
    }
  } catch {
    // File doesn't exist, create new
    workspaceConfig = { packages: [] };
  }

  // Add patterns if not already present
  const patternsToAdd = [includePattern, excludePattern];
  for (const pattern of patternsToAdd) {
    if (!workspaceConfig.packages || !workspaceConfig.packages.includes(pattern)) {
      workspaceConfig.packages = [...(workspaceConfig.packages || []), pattern];
    }
  }

  const yamlContent = `packages:\n${workspaceConfig.packages.map(p => `  - '${p}'`).join('\n')}\n`;
  await fs.writeFile(workspacePath, yamlContent, 'utf-8');
}

/**
 * Install command - download and install SDK packages
 */
export async function install(version: string, options: InstallOptions = {}): Promise<void> {
  const startTime = Date.now();
  const startDir = process.cwd();

  header('OxLayer SDK Installer');

  // Find project root (handles monorepos)
  const rootDir = findProjectRoot(startDir);

  // Check if we're in a valid project
  if (!await hasPackageJson()) {
    error('No package.json found in current directory');
    info('Navigate to your project directory before installing.');
    process.exit(1);
  }

  // Detect project type and package manager
  const projectConfig = await detectProjectType(startDir);
  info(`Project root: ${rootDir === startDir ? '.' : rootDir}`);
  info(`Package manager: ${projectConfig.packageManager}`);
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
      error('Please run: ox login');
      process.exit(1);
    }

    // Check if token is expired
    if (isTokenExpired(config)) {
      authSpinner.fail('Token expired');
      error('Your authentication token has expired. Please run: ox login');
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

  // Download packages (all packages are in a single zip)
  const downloadSpinner = createSpinner('Downloading SDK...');
  downloadSpinner.start();

  let resolvedVersion = version;
  let manifest: any;

  try {
    // Request download URL for the first package type (all are in the same zip)
    const { downloadUrl, version: resolvedVer } = await requestPackageDownload(
      packagesToInstall[0],
      version
    );
    resolvedVersion = resolvedVer;

    // Create temp directory for download
    const tempDir = join(rootDir, '.oxlayer-temp');
    await fs.mkdir(tempDir, { recursive: true });

    const zipPath = join(tempDir, `oxlayer-sdk-${resolvedVersion}.zip`);

    // Download with progress
    let lastProgress = 0;
    await downloadFile(
      downloadUrl,
      zipPath,
      (progress, total) => {
        const percent = Math.floor((progress / total) * 100);
        if (percent - lastProgress >= 10) {
          downloadSpinner.text = `Downloading SDK... ${percent}%`;
          lastProgress = percent;
        }
      }
    );

    downloadSpinner.succeed(`Downloaded SDK (${resolvedVersion})`);

    // Extract
    const extractSpinner = createSpinner('Extracting SDK...');
    extractSpinner.start();

    // Create vendor directory structure
    const vendorBaseDir = join(rootDir, VENDOR_DIR);
    const vendorVersionDir = join(vendorBaseDir, resolvedVersion);
    await fs.mkdir(vendorVersionDir, { recursive: true });

    // Extract ZIP
    await extractZip(zipPath, join(tempDir, 'extracted'));

    // The zip contains a version directory (e.g., 2026_02_14_001/)
    const extractedBase = join(tempDir, 'extracted', resolvedVersion);

    // Verify and read manifest
    const manifestPath = join(extractedBase, 'manifest.json');
    manifest = await verifyManifest(manifestPath);

    // Copy all package contents to vendor directory
    await copyDirectory(extractedBase, vendorVersionDir);

    // Create individual package.json files for each sub-package
    await createSubPackageJsons(vendorVersionDir, manifest);

    extractSpinner.succeed('Extracted SDK');

    // Update workspace configuration
    const workspaceSpinner = createSpinner('Configuring workspace...');
    workspaceSpinner.start();

    await updateWorkspaceConfig(rootDir);

    workspaceSpinner.succeed('Workspace configured');

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (err) {
    downloadSpinner.fail('Failed to install SDK');
    error(err instanceof Error ? err.message : 'Unknown error');
    process.exit(1);
  }

  console.log();

  const duration = Date.now() - startTime;

  // Success
  header('Installation Complete');
  success(`SDK version ${resolvedVersion} installed successfully`);
  info(`Duration: ${formatDuration(duration)}`);
  info(`Workspace: ${VENDOR_DIR}/${resolvedVersion}/`);

  // Auto-run package manager install
  const installSpinner = createSpinner('Running package manager install...');
  installSpinner.start();

  try {
    const installCommand = getInstallCommand(projectConfig.packageManager);
    execSync(installCommand, { cwd: rootDir, stdio: 'pipe' });
    installSpinner.succeed(`Dependencies installed via ${projectConfig.packageManager}`);
  } catch (err) {
    installSpinner.warn(`Package manager install failed. Please run '${getInstallCommand(projectConfig.packageManager)}' manually.`);
  }

  // Next steps
  console.log();
  info('Next steps:');
  console.log('  Add to your package.json:');
  console.log('       "dependencies": {');
  console.log('         "@oxlayer/capabilities-auth": "workspace:*"');
  console.log('       }');
  console.log();
  console.log('  Then import in your code:');
  console.log('       import { SomeCapability } from \'@oxlayer/capabilities-auth\';');
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
