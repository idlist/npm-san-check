import { SemVer } from 'semver'

export const SemverParts = ['major', 'minor', 'patch', 'prerelease', 'build'] as const

export type SemverPart = typeof SemverParts[number]

export interface Semver {
  major: number
  minor: number
  patch: number
  prerelease: string[]
  build: string[]
}

export const stealSemver = (semver: SemVer): Semver => {
  return {
    major: semver.major,
    minor: semver.minor,
    patch: semver.patch,
    prerelease: [...semver.prerelease.map((s) => `${s}`)],
    build: [...semver.build],
  }
}
