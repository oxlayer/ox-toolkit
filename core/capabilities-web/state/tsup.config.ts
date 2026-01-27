import { defineConfig } from 'tsup';

/**
 * tsup configuration for @oxlayer/capabilities-state
 *
 * Generates ESM output with type definitions for each subdirectory.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/workspace/index.ts',
    'src/data/index.ts',
    'src/sync/index.ts',
    'src/export/index.ts',
    'src/persist/index.ts',
    'src/persist/pure-storage.ts',
    'src/persist/sqlite-wasm/index.ts',
    'src/persist/sqlite-wasm/shared-adapter.ts',
    'src/persist/offline-storage/index.ts',
    'src/intent/index.ts',
    'src/local-only/index.ts',
  ],
  format: ['esm'],
  outDir: 'dist',
  dts: true,
  sourcemap: true,
  clean: true,
  tsconfig: './tsconfig.json',
  external: [
    /^@oxlayer\/.*/,
    /^@legendapp\/.*/,
    'react',
    'react-dom',
    '@sqlite.org/sqlite-wasm',
  ],
  treeshake: true,
});
