import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node24',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // Workspace packages ship TypeScript sources: bundle them, keep npm deps external.
  noExternal: [/^@spinema\//],
});
