import { escapeRegExp } from 'lodash-es'
import { CheckerOptions, DependencyUpdatable } from './types.js'

const replaceDependencies = (pkgData: string, deps: DependencyUpdatable[], options: CheckerOptions): string => {
  const usedSections: Set<string> = new Set(deps.map((dep) => dep.type))

  const indexOfSections: Record<string, [number, number]> = {}

  let depth = 0
  let buffer = ''
  let escape = false
  let str = false
  let key = true
  let keyUsed = false

  let name = ''
  let startIndex = 0
  let endIndex = 0

  for (let i = 0; i < pkgData.length; i++) {
    const c = pkgData[i]

    if (key) {
      // We only care about the key of the JSON, which is always a string.

      let token = ''

      if (c == '{') {
        depth += 1
      } else if (c == '}') {
        depth -= 1
      } else if (c == '\\') {
        if (str) {
          if (escape) {
            buffer += '\\'
          }
          escape = !escape
        }
      } else if (c == '"') {
        if (escape) {
          if (str) {
            buffer += '"'
          }
        } else {
          str = !str
          if (!str) {
            token = buffer
            buffer = ''
          }
        }
      } else {
        if (str) {
          buffer += c
        }
      }

      if (token) {
        key = false

        if (usedSections.has(token)) {
          keyUsed = true
          name = token
          startIndex = i
        }
      }
    } else {
      // Skip the value of the key,
      // and record the the index of the value part's end if the key is used.
      // The value part ends with ',' with the same depth (which is 1 in this case),
      // or '}' (which is end of the JSON body).

      if (depth == 1 && (c == ',' || c == '}')) {
        key = true

        if (keyUsed) {
          endIndex = i
          indexOfSections[name] = [startIndex, endIndex]
        }
      } else if (c == '{' || c == '[') {
        depth += 1
      } else if (c == '}' || c == ']') {
        depth -= 1
      }
    }
  }

  for (const [section, indexes] of Object.entries(indexOfSections)) {
    let listData = pkgData.slice(...indexes)

    for (const dep of deps.filter((dep) => dep.type == section)) {
      const reCurrent = escapeRegExp(dep.currentRaw)
      const updated = options.latest ? dep.latest : dep.newer
      const depSearcher = new RegExp(`"${dep.name}"\\s*:\\s*"${reCurrent}"`, 'g')

      listData = listData.replace(depSearcher, () => {
        return `"${dep.name}": "${updated}"`
      })
    }

    pkgData = pkgData.slice(0, indexes[0]) + listData + pkgData.slice(indexes[1])
  }

  return pkgData
}

export default replaceDependencies
