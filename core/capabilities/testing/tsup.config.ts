import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'mock-tracer': 'src/mock-tracer.ts',
    'mock-event-bus': 'src/mock-event-bus.ts',
    'mock-emitters': 'src/mock-emitters.ts',
    'mock-repository': 'src/mock-repository.ts',
    'builders': 'src/builders.ts',
    'test-helpers': 'src/test-helpers.ts',
    'assertions': 'src/assertions.ts',
    'patterns/security': 'src/patterns/security.ts',
    'patterns/authorization': 'src/patterns/authorization.ts',
    'patterns/concurrency': 'src/patterns/concurrency.ts',
    'patterns/errors': 'src/patterns/errors.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: true,
  target: 'es2022',
});
