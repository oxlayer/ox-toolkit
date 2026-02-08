import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'generate-version': 'generate-version.ts',
    'generate-manifest': 'generate-manifest.ts',
    'upload-to-r2': 'upload-to-r2.ts',
  },
  format: ['esm'],
  target: 'node22',
  clean: true,
  dts: false,
  sourcemap: true,
  shims: true,
});
