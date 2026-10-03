import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bench/worker.ts', 'bench/run.ts'],
  outDir: '.bench-build',
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  clean: true,
  splitting: false,
  external: ['tinybench'],
})
