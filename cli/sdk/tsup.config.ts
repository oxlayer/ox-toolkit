import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  splitting: false,
  minify: true,
  esbuildOptions(options) {
    options.keepNames = false;
    return options;
  },
  dts: false,
  sourcemap: false,
  shims: true,
  define: {
    // Replace env vars with literals for builds
    'process.env.OXLAYER_API_ENDPOINT': '"http://localhost:3001"',
  },
});
