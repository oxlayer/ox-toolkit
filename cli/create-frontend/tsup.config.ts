import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  clean: true,
  shims: true,
  // Don't bundle dependencies - they will be resolved from node_modules
  // This avoids Bun compatibility issues with bundled CJS/ESM interop
  external: ['chalk', 'commander', 'fs-extra', 'ora', 'prompts'],
});
