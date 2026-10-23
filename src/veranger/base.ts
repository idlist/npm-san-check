import type { PrereleaseIdentifier } from 'verkit'
import { type NumberOrWildcard, parseIntOrWildcard } from './wildcard'

export interface Verbase {
  major: NumberOrWildcard
  minor?: NumberOrWildcard
  patch?: NumberOrWildcard
  prerelease?: PrereleaseIdentifier[]
  build?: string[]
}

export function parseVerbase(raw: string) {
  const [rest, rawBuild] = raw.split('+', 2)
  const [main, rawPrerelease] = rest.split('-', 2)

  const parts = main.split('.')
  const major = parseIntOrWildcard(parts[0])
  if (Number.isNaN(major)) return

  const verbase: Verbase = { major }

  if (parts.length >= 2) {
    const minor = parseIntOrWildcard(parts[1])
    if (!Number.isNaN(minor)) verbase.minor = minor
  }

  if (parts.length >= 3) {
    const patch = parseIntOrWildcard(parts[2])
    if (!Number.isNaN(patch)) verbase.patch = patch
  }

  if (rawPrerelease) {
    const prerelease = rawPrerelease
      .split('.')
      .filter((s) => /^[0-9A-Za-z-]+$/.test(s))
      .map((s) => /^\d+$/.test(s) ? parseInt(s) : s)
    verbase.prerelease = prerelease
  }

  if (rawBuild) {
    const build = rawBuild
      .split('.')
      .filter((s) => /^[0-9A-Za-z-]+$/.test(s))
    verbase.build = build
  }

  return verbase
}
