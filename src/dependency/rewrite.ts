import type { Dependency, UpdateRecord } from '@src/types'
import { tryFormatVerange } from '@src/veranger'
import { escapeRegExp } from 'es-toolkit'

type SectionIndexes = Record<string, [number, number]>

export function rewriteUpdateInPlace(
  packageData: string,
  target: UpdateRecord,
  depsMap: Record<string, Dependency>,
): string {
  const sectionIndexes = parseIndexOfSections(packageData)

  for (const [section, indexes] of Object.entries(sectionIndexes)) {
    let listData = packageData.slice(...indexes)

    for (const [name, verange] of Object.entries(target)) {
      const dep = depsMap[name]
      if (dep == null || dep.type !== section) continue

      const updated = tryFormatVerange(verange)
      if (updated == null) continue

      const reCurrent = escapeRegExp(dep.range)
      const depSearcher = new RegExp(`"${name}"\\s*:\\s*"${reCurrent}"`, 'g')

      listData = listData.replace(depSearcher, `"${name}": "${updated}"`)
    }

    packageData = packageData.slice(0, indexes[0]) + listData + packageData.slice(indexes[1])
  }

  return packageData
}

function parseIndexOfSections(packageData: string): SectionIndexes {
  const sectionIndexes: SectionIndexes = {}

  let depth = 0
  let buffer = ''
  let isEscape = false
  let isChar = false
  let isKey = true
  let isKeyUsed = false

  let name = ''
  let startIndex = 0

  for (let i = 0; i < packageData.length; i++) {
    const c = packageData[i]

    if (isKey) {
      // Only the keys are of interest. A key is always a string.
      let token = ''

      if (c === '{') {
        depth += 1
      } else if (c === '}') {
        depth -= 1
      } else if (c === '\\') {
        if (isChar) {
          if (isEscape) buffer += '\\'
          isEscape = !isEscape
        }
      } else if (c === '"') {
        if (isEscape) {
          if (isChar) buffer += '"'
        } else {
          isChar = !isChar
          if (!isChar) {
            token = buffer
            buffer = ''
          }
        }
      } else if (isChar) {
        buffer += c
      }

      if (token) {
        isKey = false
        isKeyUsed = true
        name = token
        startIndex = i
      }
    } else {
      // Skip the value of the key,
      // and record the index of the end if the key is used.
      // The value ends at a ',' of the same depth (1 here),
      // or at '}' (end of the body).

      if (depth === 1 && (c === ',' || c === '}')) {
        isKey = true

        if (isKeyUsed) sectionIndexes[name] = [startIndex, i]
      } else if (c === '{' || c === '[') {
        depth += 1
      } else if (c === '}' || c === ']') {
        depth -= 1
      }
    }
  }

  return sectionIndexes
}
