import { defineConfig } from 'tsup';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: {
    'generate-version': join(__dirname, 'generate-version.ts'),
    'generate-manifest': join(__dirname, 'generate-manifest.ts'),
    'upload-to-r2': join(__dirname, 'upload-to-r2.ts'),
  },
  format: ['esm'],
  target: 'node22',
  clean: true,
  dts: false,
  sourcemap: true,
  shims: true,
});
