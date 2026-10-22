export type DependencyType = 'dependencies' | 'devDependencies' | 'optionalDependencies'

export interface SanCheckOptions {
  filters: string[]
  update: boolean
  checkLatest: boolean
  checkPrerelease: boolean
  checkTypes: Set<DependencyType>
  package: string
  registry: string
}
