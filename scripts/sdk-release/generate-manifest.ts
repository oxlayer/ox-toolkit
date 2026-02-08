#!/usr/bin/env node
/**
 * Generate SDK release manifest.json
 *
 * This script creates a manifest file that serves as the contract between:
 * - CI/CD pipeline
 * - Installer
 * - Licensing service
 * - Consumers
 *
 * The manifest includes all packages, their entry points, and capability mappings.
 *
 * Usage:
 *   node scripts/sdk-release/generate-manifest.ts <version> <output-dir>
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { execSync } from 'child_process';

interface PackageManifest {
  path: string;
  main: string;
  capability?: string;
  type: string;
}

interface ReleaseManifest {
  version: string;
  generatedAt: string;
  sha256: string;
  packages: Record<string, PackageManifest>;
}

// Package type mapping based on directory structure
const PACKAGE_TYPES: Record<string, string> = {
  'foundation': 'foundation',
  'capabilities': 'capability',
  'capabilities-web': 'capability',
  'pro': 'proprietary',
  'cli': 'cli',
  'channels': 'channel',
};

// Capability name mapping
const CAPABILITY_MAPPING: Record<string, string> = {
  'capabilities-auth': 'auth',
  'capabilities-cache': 'cache',
  'capabilities-events': 'events',
  'capabilities-metrics': 'metrics',
  'capabilities-telemetry': 'telemetry',
  'capabilities-openapi': 'openapi',
  'capabilities-vector': 'vector',
  'capabilities-search': 'search',
  'capabilities-queues': 'queues',
  'capabilities-scheduler': 'scheduler',
  'capabilities-testing': 'testing',
  'capabilities-internal': 'internal',
  'capabilities-adapters-web': 'web-channel',
};

function getPackageType(dirPath: string): string {
  for (const [prefix, type] of Object.entries(PACKAGE_TYPES)) {
    if (dirPath.includes(prefix)) {
      return type;
    }
  }
  return 'unknown';
}

function getCapabilityName(packageName: string): string | undefined {
  for (const [key, capability] of Object.entries(CAPABILITY_MAPPING)) {
    if (packageName.includes(key)) {
      return capability;
    }
  }
  return undefined;
}

function calculateSHA256(fileOrDir: string): string {
  if (statSync(fileOrDir).isDirectory()) {
    const hash = createHash('sha256');
    const files = getAllFiles(fileOrDir);
    files.sort(); // Ensure consistent ordering

    for (const file of files) {
      const content = readFileSync(file);
      const relativePath = file.replace(fileOrDir, '');
      hash.update(relativePath + '\0');
      hash.update(content);
    }
    return hash.digest('hex');
  } else {
    const content = readFileSync(fileOrDir);
    return createHash('sha256').update(content).digest('hex');
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

function generateManifest(version: string, outputDir: string): ReleaseManifest {
  const packages: Record<string, PackageManifest> = {};

  // Walk through the output directory to find all packages
  function scanDirectory(dir: string, baseName: string = '') {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = join(dir, entry.name);
        const pkgJsonPath = join(subPath, 'package.json');

        if (existsSync(pkgJsonPath)) {
          // This is a package directory
          try {
            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
            const packageName = pkgJson.name;

            // Find the main entry point
            let mainEntry = 'dist/index.js';
            if (pkgJson.main) {
              mainEntry = pkgJson.main;
            }

            const relativePath = subPath.replace(outputDir + '/', '');
            const packageType = getPackageType(relativePath);
            const capability = getCapabilityName(relativePath);

            packages[packageName] = {
              path: relativePath,
              main: mainEntry,
              capability,
              type: packageType,
            };
          } catch (e) {
            // Skip invalid package.json files
            console.error(`Warning: Could not parse ${pkgJsonPath}`);
          }
        } else {
          // Recursively scan subdirectories
          scanDirectory(subPath, baseName ? `${baseName}/${entry.name}` : entry.name);
        }
      }
    }
  }

  scanDirectory(outputDir);

  // Calculate SHA256 of the entire output directory
  const sha256 = calculateSHA256(outputDir);

  return {
    version,
    generatedAt: new Date().toISOString(),
    sha256,
    packages,
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/sdk-release/generate-manifest.ts <version> <output-dir>');
    process.exit(1);
  }

  const [version, outputDir] = args;

  if (!existsSync(outputDir)) {
    console.error(`Error: Output directory ${outputDir} does not exist`);
    process.exit(1);
  }

  const manifest = generateManifest(version, outputDir);

  // Write manifest to output directory
  const manifestPath = join(outputDir, 'manifest.json');
  const manifestContent = JSON.stringify(manifest, null, 2);
  require('fs').writeFileSync(manifestPath, manifestContent);

  console.log(`✅ Manifest generated: ${manifestPath}`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Packages: ${Object.keys(manifest.packages).length}`);
  console.log(`   SHA256: ${manifest.sha256}`);
}

main();
