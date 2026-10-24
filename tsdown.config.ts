import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'lib/cli.ts',
  outDir: 'bin',
  deps: {
    onlyBundle: false, // Bundle everything.
  },
  outputOptions: {
    comments: {
      annotation: false,
      jsdoc: false,
    },
  },
})
