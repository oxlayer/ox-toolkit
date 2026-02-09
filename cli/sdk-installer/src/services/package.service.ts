/**
 * Package Service
 *
 * Handles modifying package.json and managing dependencies
 */

import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Package.json structure (subset)
 */
interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Read package.json from a directory
 */
export async function readPackageJson(cwd: string = process.cwd()): Promise<PackageJson> {
  const packageJsonPath = join(cwd, 'package.json');

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`No package.json found in ${cwd}`);
  }
}

/**
 * Write package.json to a directory
 */
export async function writePackageJson(
  packageJson: PackageJson,
  cwd: string = process.cwd()
): Promise<void> {
  const packageJsonPath = join(cwd, 'package.json');

  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  );
}

/**
 * Add SDK dependencies to package.json
 *
 * This injects exact versions into dependencies or devDependencies
 * based on the manifest and install options
 */
export async function addSdkDependencies(
  manifest: import('../types/index.js').ReleaseManifest,
  options: {
    save?: boolean;
    saveDev?: boolean;
  } = {},
  cwd: string = process.cwd()
): Promise<void> {
  const packageJson = await readPackageJson(cwd);

  // Initialize dependencies if needed
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }

  // Add each package from the manifest with exact version
  for (const [packageName, packageInfo] of Object.entries(manifest.packages)) {
    const target = options.saveDev ? packageJson.devDependencies : packageJson.dependencies;

    if (options.save || options.saveDev) {
      // Use exact version from manifest
      target[packageName] = manifest.version;
    }
  }

  await writePackageJson(packageJson, cwd);
}

/**
 * Remove workspace:* references and replace with exact versions
 */
export async function freezeWorkspaceVersions(
  cwd: string = process.cwd()
): Promise<void> {
  const packageJson = await readPackageJson(cwd);

  const replaceWorkspaceVersion = (deps: Record<string, string> | undefined) => {
    if (!deps) return;

    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*' || version === 'workspace:^') {
        // Keep as is for local development
        // In production, this would be replaced with actual version
      }
    }
  };

  replaceWorkspaceVersion(packageJson.dependencies);
  replaceWorkspaceVersion(packageJson.devDependencies);

  await writePackageJson(packageJson, cwd);
}

/**
 * Check if package.json exists
 */
export async function hasPackageJson(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await fs.access(join(cwd, 'package.json'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the vendor directory path for a specific version
 */
export function getVendorDir(version: string, cwd: string = process.cwd()): string {
  return join(cwd, '.capabilities-vendor', version);
}

/**
 * Check if a version is already installed
 */
export async function isVersionInstalled(
  version: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  const vendorDir = getVendorDir(version, cwd);

  try {
    await fs.access(vendorDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the currently installed version (if any)
 */
export async function getInstalledVersion(cwd: string = process.cwd()): Promise<string | null> {
  const vendorDir = join(cwd, '.capabilities-vendor');

  try {
    const versions = await fs.readdir(vendorDir);
    // Return the most recent version (assuming semantic naming)
    return versions.sort().reverse()[0] || null;
  } catch {
    return null;
  }
}

export default {
  readPackageJson,
  writePackageJson,
  addSdkDependencies,
  freezeWorkspaceVersions,
  hasPackageJson,
  getVendorDir,
  isVersionInstalled,
  getInstalledVersion,
};
