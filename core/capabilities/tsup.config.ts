import { defineConfig } from 'tsup';

/**
 * Shared tsup configuration for all @oxlayer/capabilities packages
 *
 * This config generates:
 * - ESM output to dist/ (modern, tree-shakeable)
 * - Type definitions alongside JS files
 * - Source maps for debugging
 * - Clean dist before each build
 */
export default defineConfig({
  // Entry points - all .ts files in src/ or root index.ts
  entry: ['src/**/*.ts', 'index.ts'],
  // Output format
  format: ['esm'],
  // Output directory
  outDir: 'dist',
  // Generate type definitions
  dts: true,
  // Generate source maps
  sourcemap: true,
  // Clean output directory before build
  clean: true,
  // Use tsconfig for type checking
  tsconfig: './tsconfig.json',
  // External dependencies (don't bundle workspace deps or node modules)
  external: [
    /^@oxlayer\/capabilities.*/,
    /^@oxlayer\/staples-adapters.*/,
    // Add common external deps here
    'hono',
    'bullmq',
    'ioredis',
    'amqplib',
    'mqtt',
    '@aws-sdk/*',
    '@influxdata/*',
    '@clickhouse/*',
    '@qdrant/*',
    '@opentelemetry/*',
    'mongodb',
    'pg',
  ],
  // Minify output
  minify: false,
  // Splitting for better tree-shaking
  splitting: false,
  // Skip node modules bundle
  noExternal: [],
  // Treeshake
  treeshake: true,
  // onSuccess hook
  onSuccess: 'echo "Build complete: ${TARGET_FILE}"',
});
