/**
 * Automatically link @oxlayer packages from local workspace directories
 * without needing to manually list each package in pnpm-workspace.yaml overrides
 */

const { resolve } = require('path')
const { existsSync } = require('fs')

// Map package name patterns to their directories
const packagePatterns = [
  // Foundation packages: @oxlayer/foundation-* -> foundation/*
  {
    prefix: '@oxlayer/foundation-',
    getDir: (suffix) => resolve(__dirname, 'foundation', suffix),
  },
  // Capabilities packages: @oxlayer/capabilities-* -> capabilities/*
  {
    prefix: '@oxlayer/capabilities-',
    getDir: (suffix) => resolve(__dirname, 'capabilities', suffix),
  },
  // Capability adapters: @oxlayer/capabilities-adapters-* -> capabilities/adapters/*
  {
    prefix: '@oxlayer/capabilities-adapters-',
    getDir: (suffix) => {
      // Split suffix like 'postgres-tenancy' into 'postgres' and 'tenancy'
      const parts = suffix.split('-')
      const adapterType = parts[0] // postgres, redis, rabbitmq, etc.
      const remainder = parts.slice(1).join('-')
      return resolve(__dirname, 'capabilities', 'adapters', adapterType, remainder)
    },
  },
  // Proprietary packages: @oxlayer/pro-* -> proprietary/*
  {
    prefix: '@oxlayer/pro-',
    getDir: (suffix) => resolve(__dirname, 'proprietary', suffix),
  },
  // Proprietary adapters: @oxlayer/pro-adapters-* -> proprietary/adapters/*
  {
    prefix: '@oxlayer/pro-adapters-',
    getDir: (suffix) => {
      const parts = suffix.split('-')
      const adapterType = parts[0]
      const remainder = parts.slice(1).join('-')
      return resolve(__dirname, 'proprietary', 'adapters', adapterType, remainder)
    },
  },
]

function readPackage(pkg, context) {
  // Only modify @oxlayer packages
  if (!pkg.name?.startsWith('@oxlayer/')) {
    return pkg
  }

  const resolutions = pkg.resolutions || {}

  for (const [depName, depVersion] of Object.entries(pkg.dependencies || {})) {
    // Skip if already has a resolution or not an @oxlayer package
    if (resolutions[depName] || !depName.startsWith('@oxlayer/')) {
      continue
    }

    // Skip if already using workspace protocol
    if (depVersion === 'workspace:*' || depVersion === 'workspace:^' || depVersion === 'workspace:~') {
      continue
    }

    // Try to find a matching directory for this package
    for (const { prefix, getDir } of packagePatterns) {
      if (depName.startsWith(prefix)) {
        const suffix = depName.slice(prefix.length)
        const dir = getDir(suffix)

        if (existsSync(dir)) {
          // Add a resolution to link to the local package
          resolutions[depName] = 'link:' + dir
        }
        break
      }
    }
  }

  if (Object.keys(resolutions).length > 0) {
    pkg.resolutions = resolutions
  }

  return pkg
}

module.exports = {
  hooks: {
    readPackage,
  },
}