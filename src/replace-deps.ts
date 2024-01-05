// Heavily copied from
// https://github.com/raineorshine/npm-check-updates/blob/main/src/lib/upgradePackageData.ts
// Apache-2.0 (c) 2013 Tomas Junnonen

import { CheckerOptions, DependencyUpdated } from './types.js'

function escapeRegex(s: string) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

const replaceDependencies = (pkgData: string, deps: DependencyUpdated[], options: CheckerOptions): string => {
  const usedSections = [...new Set(deps.map((dep) => dep.type))]
  const sectionRegex = new RegExp(`"((?:${usedSections.join('|')})"\\s*:\\s*{\\s*)(.+?)(\\s*})`, 'gs')

  const updatedData = pkgData.replace(sectionRegex, (_, left, content, right) => {
    console.log(content)
    return left + content + right
  })

  return updatedData
}

export default replaceDependencies
