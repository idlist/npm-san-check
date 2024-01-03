import { dirname } from 'desm'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import ts from '@typescript-eslint/parser'

const __dirname = dirname(import.meta.url)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
})

const jsFiles = [
  'eslint.config.js',
]

const tsFiles = [
  '*.ts',
  'src/**/*.ts',
  'lib/**/*.ts',
]

export default [
  {
    files: tsFiles,
    languageOptions: {
      parser: ts,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  ...compat.config({
    overrides: [
      {
        files: tsFiles,
        extends: ['plugin:@typescript-eslint/recommended'],
      },
    ],
  }),
  {
    files: tsFiles,
    rules: {
      '@typescript-eslint/no-empty': 'off',
      '@typescript-eslint/no-empty-interface': 'off',

      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
  {
    files: jsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ...js.configs.recommended,
    rules: {
      'no-empty': 'off',

      'no-empty-function': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prefer-const': 'warn',
    },
  },
  {
    files: [...tsFiles, ...jsFiles],
    rules: {
      indent: ['warn', 2, { SwitchCase: 1 }],
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'],
      'comma-dangle': ['warn', 'always-multiline'],
      'arrow-parens': ['warn', 'always'],
      'eol-last': ['warn', 'always'],
    },
  },
]
