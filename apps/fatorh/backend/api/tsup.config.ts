import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'es2022',
  clean: true,
  dts: false, // Disable DTS generation due to jsx config conflict
  sourcemap: true,
  splitting: false,
  minify: false,
  external: [
    // Mark all oxlayer workspace packages as external
    /^@oxlayer\/.*/,
    // Mark other runtime dependencies as external
    'hono',
    'drizzle-orm',
    'postgres',
    'ioredis',
    'zod',
    'cpf-cnpj-validator',
    'csv-parse',
    'dotenv',
    '@aws-sdk/*',
  ],
});
