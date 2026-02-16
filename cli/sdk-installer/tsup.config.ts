import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  dts: false,
  sourcemap: true,
  shims: true,
  define: {
    // Replace env vars with literals for builds
    'process.env.OXLAYER_API_ENDPOINT': '"http://localhost:3001"',
  },
});
