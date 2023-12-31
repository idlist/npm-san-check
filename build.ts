import { build } from 'esbuild'
import pkg from './package.json' with { type: 'json' }

build({
  entryPoints: ['lib/cli.ts'],
  outdir: 'bin',
  platform: 'node',
  format: 'esm',
  bundle: true,
  external: [...Object.keys(pkg.dependencies)],
})
