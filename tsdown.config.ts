import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'lib/cli-old.ts',
  outDir: 'bin',
  deps: {},
})
