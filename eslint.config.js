import globals from 'globals'
import js from '@eslint/js'
import ts from 'typescript-eslint'

const jsFiles = [
  'eslint.config.js',
]

const tsFiles = [
  'src/**/*.ts',
  'lib/**/*.ts',
]

const tsScriptFiles = [
  '*.ts',
]

export default ts.config(
  {
    files: [...tsFiles, ...tsScriptFiles],
    extends: [
      js.configs.recommended,
      ...ts.configs.recommended,
    ],
  },
  {
    files: tsFiles,
    extends: [
      ...ts.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: [...tsFiles, ...tsScriptFiles],
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
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      indent: ['warn', 2, { SwitchCase: 1 }],
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'],
      'comma-dangle': ['warn', 'always-multiline'],
      'arrow-parens': ['warn', 'always'],
      'eol-last': ['warn', 'always'],
    },
  },
)
