interface ParsedRange {
  type: '^' | '~' | '-' | '=' | '>' | '>=' | '<' | '<='
  op: string[]
}

const parseRange = (raw: string): ParsedRange | undefined => {
  const segments = raw.split('||')

  // Skip parsing range if the range is a composed range.
  // Let user handle the specific case by themselves.
  if (segments.length > 2) {
    return
  }

  const segment = segments[0]
}

export default parseRange
