import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'lib/cli.ts',
  outDir: 'bin',
  deps: {},
})
