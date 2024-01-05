import c from 'kleur'

// Rename necessary logging to distinguish with debug logs.
const print = (...content: unknown[]) => void console.log(...content)

print.error = (...content: unknown[]) => void console.log(c.red('Error:'), content)

export default print
