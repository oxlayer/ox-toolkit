/**
 * Environment Detection
 *
 * Detect project type and configuration
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { readPackageJson } from '../services/package.service.js';

/**
 * Detected project type
 */
export type ProjectType = 'backend' | 'frontend' | 'unknown';

/**
 * Package manager type
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

/**
 * Project configuration
 */
export interface ProjectConfig {
  type: ProjectType;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  packageManager: PackageManager;
  rootDir: string;
}

/**
 * Detect the package manager being used
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(cwd, 'bun.lockb'))) {
    return 'bun';
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  return 'unknown';
}

/**
 * Find the project root directory (handles monorepos)
 *
 * Searches upward from the current directory to find package.json
 * Stops at the root or when finding a workspace config (pnpm-workspace.yaml, etc.)
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let currentDir = startDir;

  while (currentDir !== '/' && currentDir !== '.') {
    // Check if this is a project root (has package.json)
    if (existsSync(join(currentDir, 'package.json'))) {
      // Also check for workspace indicators - this is definitely a root
      if (existsSync(join(currentDir, 'pnpm-workspace.yaml')) ||
          existsSync(join(currentDir, 'turbo.json')) ||
          existsSync(join(currentDir, 'lerna.json')) ||
          existsSync(join(currentDir, 'nx.json'))) {
        return currentDir;
      }

      // Check if package.json has workspaces field
      try {
        const pkgPath = join(currentDir, 'package.json');
        const pkgContent = readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        if (pkg.workspaces) {
          return currentDir;
        }
      } catch {
        // Ignore parse errors
      }

      // If we're at startDir and it has package.json, use it
      if (currentDir === startDir) {
        return currentDir;
      }
    }

    // Move up one directory
    const parentDir = join(currentDir, '..');
    if (parentDir === currentDir) {
      // Can't go up further
      break;
    }
    currentDir = parentDir;
  }

  // Fallback to start directory
  return startDir;
}

/**
 * Detect project type based on dependencies
 */
export async function detectProjectType(cwd: string = process.cwd()): Promise<ProjectConfig> {
  const rootDir = findProjectRoot(cwd);
  const hasPackageJson = existsSync(join(rootDir, 'package.json'));
  const hasTsConfig = existsSync(join(rootDir, 'tsconfig.json')) || existsSync(join(rootDir, 'tsconfig.json'));
  const packageManager = detectPackageManager(rootDir);

  let type: ProjectType = 'unknown';

  if (hasPackageJson) {
    try {
      const pkg = await readPackageJson(rootDir);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // We only support React for frontend and Hono for backend
      const hasReact = 'react' in deps || 'react-dom' in deps || '@types/react' in deps || 'next' in deps;
      const hasHono = 'hono' in deps || '@hono/hono' in deps;

      const isFrontend = hasReact;
      const isBackend = hasHono;

      if (isFrontend && isBackend) {
        type = 'unknown'; // Both detected - user should specify
      } else if (isFrontend) {
        type = 'frontend';
      } else if (isBackend) {
        type = 'backend';
      }
    } catch {
      // If we can't read package.json, keep as unknown
    }
  }

  return {
    type,
    hasPackageJson,
    hasTsConfig,
    packageManager,
    rootDir,
  };
}

/**
 * Get the install command for a package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'pnpm':
      return 'pnpm install';
    case 'bun':
      return 'bun install';
    case 'yarn':
      return 'yarn install';
    case 'npm':
      return 'npm install';
    default:
      return 'pnpm install'; // Default to pnpm
  }
}

/**
 * Get recommended packages for a project type
 */
export function getRecommendedPackages(projectType: ProjectType): string[] {
  switch (projectType) {
    case 'backend':
      return ['backend-sdk'];
    case 'frontend':
      return ['frontend-sdk'];
    default:
      return ['backend-sdk', 'frontend-sdk', 'cli-tools'];
  }
}

export default {
  detectPackageManager,
  detectProjectType,
  findProjectRoot,
  getInstallCommand,
  getRecommendedPackages,
};
