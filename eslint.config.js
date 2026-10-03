import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

export default [
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', '.bench-build/**', '.bench-results/**'],
  },
  {
    files: ['src/**/*.{ts}', 'test/**/*.{ts}', 'playground/**/*.{ts}', 'bench/**/*.{ts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  eslintPluginPrettierRecommended,
]
