import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/tailwind/nextjs.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
});
