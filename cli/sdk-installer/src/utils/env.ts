/**
 * Environment Detection
 *
 * Detect project type and configuration
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { readPackageJson } from '../services/package.service.js';

/**
 * Detected project type
 */
export type ProjectType = 'backend' | 'frontend' | 'fullstack' | 'unknown';

/**
 * Project configuration
 */
export interface ProjectConfig {
  type: ProjectType;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'unknown';
  rootDir: string;
}

/**
 * Detect the package manager being used
 */
export function detectPackageManager(cwd: string = process.cwd()): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
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
 * Detect project type based on dependencies
 */
export async function detectProjectType(cwd: string = process.cwd()): Promise<ProjectConfig> {
  const hasPackageJson = existsSync(join(cwd, 'package.json'));
  const hasTsConfig = existsSync(join(cwd, 'tsconfig.json')) || existsSync(join(cwd, 'tsconfig.json'));
  const packageManager = detectPackageManager(cwd);

  let type: ProjectType = 'unknown';

  if (hasPackageJson) {
    try {
      const pkg = await readPackageJson(cwd);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      const hasReact = 'react' in deps || 'react-dom' in deps || '@types/react' in deps;
      const hasExpress = 'express' in deps || 'fastify' in deps || 'hono' in deps;
      const hasVue = 'vue' in deps || '@types/vue' in deps;
      const hasSvelte = 'svelte' in deps;

      const isFrontend = hasReact || hasVue || hasSvelte;
      const isBackend = hasExpress;

      if (isFrontend && isBackend) {
        type = 'fullstack';
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
    rootDir: cwd,
  };
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
    case 'fullstack':
      return ['backend-sdk', 'frontend-sdk'];
    default:
      return ['backend-sdk', 'frontend-sdk', 'cli-tools'];
  }
}

export default {
  detectPackageManager,
  detectProjectType,
  getRecommendedPackages,
};
