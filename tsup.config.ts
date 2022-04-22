import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
  },
  {
    name: 'minified',
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    minify: true,
    legacyOutput: true,
    outDir: 'dist/minified',
  },
]);
