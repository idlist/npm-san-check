import { type SemVer } from 'semver'

export const SemverParts = ['major', 'minor', 'patch', 'prerelease', 'build'] as const

export type SemverPart = typeof SemverParts[number]

export type Prerelease = (number | string)[]

export interface Semver {
  major: number
  minor: number
  patch: number
  prerelease: Prerelease
  build: string[]
}

export const takeSemverFrom = (semver: SemVer): Semver => {
  return {
    major: semver.major,
    minor: semver.minor,
    patch: semver.patch,
    prerelease: [...semver.prerelease],
    build: [...semver.build],
  }
}
