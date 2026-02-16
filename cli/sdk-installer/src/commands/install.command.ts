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

const VENDOR_DIR = '.capabilities-vendor';
const CAPABILITIES_DIR = '.capabilities';

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
 * Generate package.json for the SDK workspace package
 */
function generatePackageJson(version: string, manifest: any): string {
  // Build exports map from manifest packages
  const exports: Record<string, string> = {};
  const dependencies: Record<string, string> = {};

  for (const [name, pkg] of Object.entries(manifest.packages) as [string, any][]) {
    const relativePath = pkg.path;
    exports[name] = `./${relativePath}`;
    dependencies[name] = `workspace:*`;

    // Also export sub-paths for better DX
    const parts = name.split('/').slice(1); // Remove @oxlayer prefix
    if (parts.length > 1) {
      const subPath = parts.join('-');
      exports[`@oxlayer/${subPath}`] = `./${relativePath}`;
    }
  }

  return JSON.stringify({
    name: '@oxlayer/sdk-workspace',
    version: version,
    private: true,
    description: `OxLayer SDK v${version} - Local workspace package`,
    type: 'module',
    exports,
    dependencies,
  }, null, 2);
}

/**
 * Update or create pnpm-workspace.yaml to include vendor directory
 */
async function updateWorkspaceConfig(rootDir: string, vendorVersionDir: string): Promise<void> {
  const workspacePath = join(rootDir, 'pnpm-workspace.yaml');
  const relativeVendorPath = vendorVersionDir.replace(rootDir + '/', '').replace(/^\//, '');

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

  // Add vendor path if not already present
  if (!workspaceConfig.packages?.includes(relativeVendorPath)) {
    workspaceConfig.packages = [...(workspaceConfig.packages || []), relativeVendorPath];

    const yamlContent = `packages:\n${workspaceConfig.packages.map(p => `  - '${p}'`).join('\n')}\n`;
    await fs.writeFile(workspacePath, yamlContent, 'utf-8');
  }
}

/**
 * Create or update the 'current' symlink
 */
async function updateCurrentSymlink(baseDir: string, version: string): Promise<void> {
  const currentPath = join(baseDir, 'current');
  const versionPath = join(baseDir, version);

  try {
    // Remove existing symlink
    await fs.unlink(currentPath);
  } catch {
    // Doesn't exist, that's fine
  }

  // Create new symlink
  await fs.symlink(versionPath, currentPath, 'dir');
}

/**
 * Add workspace dependency to project's package.json
 */
async function addWorkspaceDependency(rootDir: string, vendorVersionPath: string): Promise<void> {
  const packageJsonPath = join(rootDir, 'package.json');

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    // Add @oxlayer/sdk-workspace as a workspace dependency
    if (!pkg.dependencies) {
      pkg.dependencies = {};
    }

    // Only add if not already present
    if (!pkg.dependencies['@oxlayer/sdk-workspace']) {
      pkg.dependencies['@oxlayer/sdk-workspace'] = 'workspace:*';
    }

    // Write back with proper formatting
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  } catch (err) {
    throw new Error(`Failed to update package.json: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
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

    // Generate package.json for the workspace
    const packageJsonPath = join(vendorVersionDir, 'package.json');
    const packageJsonContent = generatePackageJson(resolvedVersion, manifest);
    await fs.writeFile(packageJsonPath, packageJsonContent, 'utf-8');

    extractSpinner.succeed('Extracted SDK');

    // Update workspace configuration
    const workspaceSpinner = createSpinner('Configuring workspace...');
    workspaceSpinner.start();

    await updateWorkspaceConfig(rootDir, vendorVersionDir);

    // Update 'current' symlink
    await updateCurrentSymlink(vendorBaseDir, resolvedVersion);

    // Add workspace dependency to project's package.json
    await addWorkspaceDependency(rootDir, vendorVersionDir);

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
  info(`Current link: ${CAPABILITIES_DIR}/current -> ${resolvedVersion}`);

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
  console.log('  Import in your code:');
  console.log('       import { SomeCapability } from \'@oxlayer/sdk-workspace\';');
  console.log();
  console.log(`  To switch SDK versions, update the ${CAPABILITIES_DIR}/current symlink.`);
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
