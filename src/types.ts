export const dependencyTypes = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
] as const

export type DependencyType = typeof dependencyTypes[number]

export const versionProviders = [
  'npm',
  'jsd',
] as const

export type VersionProvider = typeof versionProviders[number]

export interface SanCheckOptions {
  filters: string[]
  update: boolean
  checkLatest: boolean
  checkPrerelease: boolean
  checkTypes: Set<DependencyType>
  file: string
  provider: 'npm' | 'jsd'
  registry: string
}
