import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: false,
  dts: false,
  splitting: false,
  // Bundle internal workspace packages directly into dist/index.js so it can be installed standalone
  noExternal: [
    '@project-memory/core',
    '@project-memory/analyzer',
    '@project-memory/interview',
    '@project-memory/mcp',
  ],
});
