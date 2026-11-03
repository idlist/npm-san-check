import { defineConfig } from 'tsdown'

const banner = `/*
THIS IS A BUNDLED FILE BY TSDOWN
Please visit the GitHub repository of this tool for the source file:
https://github.com/idlist/npm-san-check

the distributed file contains bundled third-party libraries,
which retain their original copyrights and licenses.
To see the list of dependencies and their upstream licenses, please refer to:
https://github.com/idlist/npm-san-check/blob/main/package.json
*/`

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
    postBanner: banner,
  },
})
